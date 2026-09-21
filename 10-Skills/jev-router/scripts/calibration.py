"""Does Jev's 0.80 actually happen 80% of the time -- on OUR workload?

Jev is trained with RLCD, which optimises probabilities against real outcomes
rather than human preference. That is a claim about TypeSafe's distribution,
not about ours. A confidence gate built on borrowed calibration is borrowed
trust: the threshold looks principled and is, in fact, decorative until
somebody checks the curve on the questions this project actually asks.

This module does the checking. It logs every decision with the information
needed to score it later, and computes the standard diagnostics once outcomes
are known: Brier score, log loss, Expected Calibration Error, and a reliability
table.

THE PART MOST CALIBRATION CODE GETS WRONG
-----------------------------------------
Every number here is noise at small n, and small n is exactly where people
quote them. An ECE of 0.04 on thirty decisions says nothing whatsoever. So
every report carries `n`, a `verdict`, and a minimum-sample figure derived the
same way TradeCC derives its detection floor -- and `verdict` is UNDERPOWERED
until the sample clears it, no matter how flattering the score.

A report that cannot yet conclude says so. That is the whole point of writing
this rather than eyeballing a handful of calls.
"""

from __future__ import annotations

import json
import math
import time
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence

# --- how much evidence a calibration claim needs ---------------------------

# The standard error of a proportion is sqrt(p(1-p)/n), worst case at p=0.5.
# To resolve a miscalibration of `tolerance` at 95% confidence you need
# n >= (1.96 / (2 * tolerance))^2 PER BIN -- not per run. Ten bins means ten
# times that before a full reliability curve means anything, which is why
# honest calibration work is slow and why this file refuses to pretend
# otherwise.
Z_95 = 1.959964
DEFAULT_TOLERANCE = 0.10  # resolve a 10-percentage-point calibration error


def minimum_samples_per_bin(tolerance: float = DEFAULT_TOLERANCE) -> int:
    """Samples needed in a bin before its empirical rate is worth reading."""
    if not 0 < tolerance < 0.5:
        raise ValueError("tolerance must be in (0, 0.5)")
    return math.ceil((Z_95 / (2 * tolerance)) ** 2)


# --- the log ----------------------------------------------------------------


@dataclass
class DecisionRecord:
    """One decision, and (later) what actually happened.

    `predicted` is the probability the model assigned to the outcome that was
    ACTUALLY RESOLVED -- not to whatever it chose. Scoring the chosen option
    only would measure confidence-when-right and quietly discard every miss,
    which is how a badly calibrated model gets a clean bill of health.
    """

    question: str
    predicted: float
    outcome: bool | None = None
    choice: str | None = None
    model: str | None = None
    route: str | None = None
    latency_ms: int | None = None
    cost_usd: float | None = None
    at: float = field(default_factory=time.time)
    note: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.predicted, (int, float)) or isinstance(self.predicted, bool):
            raise ValueError(f"predicted must be a number, got {self.predicted!r}")
        if not 0.0 <= float(self.predicted) <= 1.0:
            raise ValueError(f"predicted must be in [0, 1], got {self.predicted}")
        self.predicted = float(self.predicted)

    @property
    def resolved(self) -> bool:
        return self.outcome is not None


class DecisionLog:
    """Append-only JSONL. One line per decision, resolved later in place.

    Append-only because a calibration log you can rewrite is a calibration log
    you can flatter. Resolution appends a new line for the same id rather than
    editing the old one, and the reader takes the last state it sees.
    """

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    def append(self, record: DecisionRecord) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(asdict(record), sort_keys=True) + "\n")

    def records(self) -> Iterator[DecisionRecord]:
        if not self.path.exists():
            return
        for line in self.path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                yield DecisionRecord(**json.loads(line))
            except (json.JSONDecodeError, TypeError, ValueError):
                # A corrupt line must not silently shrink the sample, because a
                # smaller sample scores better on nothing and worse on nothing.
                raise ValueError(f"unreadable line in {self.path}: {line[:120]!r}") from None

    def resolved(self) -> list[DecisionRecord]:
        return [r for r in self.records() if r.resolved]


# --- the metrics ------------------------------------------------------------


def brier_score(records: Sequence[DecisionRecord]) -> float:
    """Mean squared error of the probabilities. Lower is better; 0.25 is the
    score of always saying 0.5, so anything at or above that beats nothing."""
    if not records:
        raise ValueError("brier_score needs at least one resolved record")
    return sum((r.predicted - float(r.outcome)) ** 2 for r in records) / len(records)


def log_loss(records: Sequence[DecisionRecord], eps: float = 1e-12) -> float:
    """Punishes confident mistakes far harder than Brier does. Clipped, because
    a single 0.0 on a true outcome is infinite and would hide everything else."""
    if not records:
        raise ValueError("log_loss needs at least one resolved record")
    total = 0.0
    for r in records:
        p = min(max(r.predicted, eps), 1 - eps)
        total -= math.log(p) if r.outcome else math.log(1 - p)
    return total / len(records)


def base_rate(records: Sequence[DecisionRecord]) -> float:
    """How often the outcome is true. The thing a model must beat to be worth
    calling at all -- a constant predictor of this value is the free baseline."""
    if not records:
        raise ValueError("base_rate needs at least one resolved record")
    return sum(1 for r in records if r.outcome) / len(records)


def baseline_brier(records: Sequence[DecisionRecord]) -> float:
    """Brier score of always predicting the base rate. This is the number the
    model has to beat, and it is not 0.25 unless outcomes are balanced."""
    rate = base_rate(records)
    return sum((rate - float(r.outcome)) ** 2 for r in records) / len(records)


@dataclass(frozen=True)
class Bin:
    low: float
    high: float
    n: int
    mean_predicted: float
    empirical_rate: float

    @property
    def gap(self) -> float:
        return abs(self.mean_predicted - self.empirical_rate)

    @property
    def underpowered(self) -> bool:
        return self.n < minimum_samples_per_bin()


def reliability(records: Sequence[DecisionRecord], bins: int = 10) -> list[Bin]:
    """Predicted probability against what actually happened, bucketed.

    Empty buckets are omitted rather than reported as 0.0 -- "no evidence" and
    "never happened" are different claims and conflating them bends the curve.
    """
    if bins < 2:
        raise ValueError("need at least 2 bins")
    buckets: dict[int, list[DecisionRecord]] = defaultdict(list)
    for r in records:
        idx = min(int(r.predicted * bins), bins - 1)
        buckets[idx].append(r)
    out = []
    for idx in sorted(buckets):
        group = buckets[idx]
        out.append(Bin(
            low=idx / bins,
            high=(idx + 1) / bins,
            n=len(group),
            mean_predicted=sum(r.predicted for r in group) / len(group),
            empirical_rate=sum(1 for r in group if r.outcome) / len(group),
        ))
    return out


def expected_calibration_error(records: Sequence[DecisionRecord], bins: int = 10) -> float:
    """Sample-weighted mean gap between promise and delivery."""
    if not records:
        raise ValueError("ECE needs at least one resolved record")
    return sum(b.n * b.gap for b in reliability(records, bins)) / len(records)


# --- the report -------------------------------------------------------------


@dataclass(frozen=True)
class CalibrationReport:
    n: int
    verdict: str
    brier: float | None
    baseline_brier: float | None
    log_loss: float | None
    ece: float | None
    base_rate: float | None
    bins: list[Bin]
    min_per_bin: int
    beats_baseline: bool | None
    summary: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "n": self.n,
            "verdict": self.verdict,
            "brier": self.brier,
            "baseline_brier": self.baseline_brier,
            "log_loss": self.log_loss,
            "ece": self.ece,
            "base_rate": self.base_rate,
            "min_per_bin": self.min_per_bin,
            "beats_baseline": self.beats_baseline,
            "bins": [
                {"range": f"{b.low:.1f}-{b.high:.1f}", "n": b.n,
                 "predicted": round(b.mean_predicted, 3),
                 "actual": round(b.empirical_rate, 3),
                 "gap": round(b.gap, 3), "underpowered": b.underpowered}
                for b in self.bins
            ],
            "summary": self.summary,
        }


def assess(
    records: Iterable[DecisionRecord],
    *,
    bins: int = 10,
    tolerance: float = DEFAULT_TOLERANCE,
) -> CalibrationReport:
    """Score a set of resolved decisions, and refuse to conclude on too few.

    Verdicts:
      NO_DATA       nothing resolved yet
      UNDERPOWERED  too few to distinguish calibration from luck
      CALIBRATED    enough evidence, and the curve holds within tolerance
      MISCALIBRATED enough evidence, and it does not
    """
    resolved = [r for r in records if r.resolved]
    need = minimum_samples_per_bin(tolerance)

    if not resolved:
        return CalibrationReport(
            n=0, verdict="NO_DATA", brier=None, baseline_brier=None, log_loss=None,
            ece=None, base_rate=None, bins=[], min_per_bin=need, beats_baseline=None,
            summary="No resolved decisions yet. Log outcomes before reading any "
                    "calibration number: every metric here is undefined on an "
                    "empty sample and misleading on a small one.",
        )

    curve = reliability(resolved, bins)
    ece = expected_calibration_error(resolved, bins)
    score = brier_score(resolved)
    floor = baseline_brier(resolved)
    powered = [b for b in curve if not b.underpowered]

    # A sample only supports a conclusion when at least two bins are
    # individually powered. One powered bin says the model is calibrated at one
    # probability, which is not calibration -- it is a coincidence with a
    # sample size.
    if len(powered) < 2:
        return CalibrationReport(
            n=len(resolved), verdict="UNDERPOWERED", brier=score, baseline_brier=floor,
            log_loss=log_loss(resolved), ece=ece, base_rate=base_rate(resolved),
            bins=curve, min_per_bin=need, beats_baseline=score < floor,
            summary=(
                f"{len(resolved)} resolved decisions, but only {len(powered)} bin(s) "
                f"reach the {need} samples needed to resolve a {tolerance:.0%} "
                f"calibration error. The scores below are computed and are NOT yet "
                f"evidence either way. Keep logging."
            ),
        )

    worst = max(powered, key=lambda b: b.gap)
    ok = ece <= tolerance
    return CalibrationReport(
        n=len(resolved),
        verdict="CALIBRATED" if ok else "MISCALIBRATED",
        brier=score, baseline_brier=floor, log_loss=log_loss(resolved), ece=ece,
        base_rate=base_rate(resolved), bins=curve, min_per_bin=need,
        beats_baseline=score < floor,
        summary=(
            f"{len(resolved)} resolved decisions across {len(powered)} powered bin(s). "
            f"ECE {ece:.3f} against a {tolerance:.0%} tolerance -> "
            f"{'within' if ok else 'OUTSIDE'}. Worst powered bin "
            f"{worst.low:.1f}-{worst.high:.1f}: promised {worst.mean_predicted:.2f}, "
            f"delivered {worst.empirical_rate:.2f} on n={worst.n}. "
            f"Brier {score:.4f} against a base-rate baseline of {floor:.4f} -- "
            f"{'better' if score < floor else 'NO BETTER'} than predicting the base "
            f"rate every time."
            + ("" if ok else " Apply Platt scaling in the policy layer, or move the "
                              "thresholds; do not keep gating on the raw number.")
        ),
    )


def format_report(report: CalibrationReport) -> str:
    lines = [f"calibration: {report.verdict}  (n={report.n})", ""]
    if report.bins:
        lines.append(f"  {'range':>9}  {'n':>5}  {'promised':>9}  {'actual':>7}  {'gap':>6}")
        for b in report.bins:
            flag = "  (underpowered)" if b.underpowered else ""
            lines.append(
                f"  {b.low:.1f}-{b.high:.1f}  {b.n:>5}  {b.mean_predicted:>9.3f}  "
                f"{b.empirical_rate:>7.3f}  {b.gap:>6.3f}{flag}"
            )
        lines.append("")
    lines.append(f"  {report.summary}")
    return "\n".join(lines)
