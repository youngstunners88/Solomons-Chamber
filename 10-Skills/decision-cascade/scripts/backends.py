"""Backends for the cascade, and an honest capability probe.

Three decision backends share the same three primitives -- `choice`, `score`,
`noul` -- because they are the same architecture family:

  * **Jev / TypeSafe System One** -- remote, metered, reached over the network.
  * **Laya** (Convai Innovations, Apache-2.0) -- open weights, "System 1
    decision engine", same three types, same RLCD training. Runs on PyTorch
    (CPU or CUDA) anywhere.
  * **laya-mlx** -- an MLX port of Laya. Apple Silicon ONLY.

That overlap is the finding: the thing we currently rent per call has an
open-weight equivalent we can run in-process.

WHAT THIS MACHINE CAN ACTUALLY DO

`probe()` reports it rather than assuming. On an x86_64 Linux box `laya-mlx`
cannot install at all -- its dependency is gated
`sys_platform == 'darwin' and platform_machine == 'arm64'` -- so anything here
that claimed MLX speed would be fiction. Upstream `laya` on PyTorch is the
portable path, and on CPU it is SLOWER than the remote call, which the cascade's
break-even test will say plainly.

Published latency, for budgeting (`Tier.expected_latency_ms`). These are other
people's numbers except where marked, and they are the reason `probe()` exists:

  | backend                 | latency        | source                       |
  |-------------------------|----------------|------------------------------|
  | Jev via OpenRouter      | 347 ms median  | OUR measurement, 5 calls     |
  | Laya PyTorch CPU        | 193-464 ms     | upstream README              |
  | Laya PyTorch T4 GPU     | 32.8 ms        | upstream README              |
  | laya-mlx FP16, M3 Max   | 10.9-17.8 ms   | repo BENCHMARKS.md           |
  | laya-mlx FP16, M3 Max   | 7.4-13.4 ms    | repo README -- DISAGREES     |

The last two rows describe the same configuration and do not match. Neither is
used as a default here; measure on your own hardware with `calibrate_latency`.
"""

from __future__ import annotations

import importlib.util
import platform
import statistics
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable

__all__ = [
    "Capability",
    "LAYA_MLX_PLATFORM_NOTE",
    "calibrate_latency",
    "make_jev_backend",
    "probe",
]

LAYA_MLX_PLATFORM_NOTE = (
    "laya-mlx requires macOS on Apple Silicon (its mlx dependency is gated "
    "sys_platform=='darwin' and platform_machine=='arm64'). Upstream `laya` on "
    "PyTorch is the portable alternative and runs on CPU or CUDA."
)


@dataclass(frozen=True)
class Capability:
    name: str
    available: bool
    reason: str
    suggested_latency_ms: float | None = None

    def require(self) -> None:
        if not self.available:
            raise RuntimeError(f"{self.name} unavailable: {self.reason}")


def _installed(module: str) -> bool:
    try:
        return importlib.util.find_spec(module) is not None
    except (ImportError, ValueError):
        return False


def probe() -> dict[str, Capability]:
    """What can actually run here, right now. No optimism.

    Deliberately reports `suggested_latency_ms` as None for everything: a
    budget must come from `calibrate_latency` on the real machine, not from a
    table copied out of someone else's README.
    """
    is_mac_arm = platform.system() == "Darwin" and platform.machine() == "arm64"
    caps: dict[str, Capability] = {}

    if not is_mac_arm:
        caps["laya_mlx"] = Capability(
            "laya_mlx", False,
            f"host is {platform.system()}/{platform.machine()}. {LAYA_MLX_PLATFORM_NOTE}",
        )
    elif not _installed("mlx"):
        caps["laya_mlx"] = Capability(
            "laya_mlx", False, "Apple Silicon host but mlx is not installed "
            "(pip install laya-mlx)",
        )
    else:
        caps["laya_mlx"] = Capability(
            "laya_mlx", _installed("laya_mlx"),
            "ready" if _installed("laya_mlx") else "mlx present but laya_mlx is not installed",
        )

    torch_ok = _installed("torch")
    caps["laya_torch"] = Capability(
        "laya_torch",
        _installed("laya") and torch_ok,
        "ready" if (_installed("laya") and torch_ok)
        else f"needs `pip install laya` (torch present: {torch_ok}); "
             "portable across CPU and CUDA",
    )

    import os
    has_key = bool(os.environ.get("OPENROUTER_API_KEY") or os.environ.get("TYPESAFE_API_KEY")
                   or os.environ.get("TYPESAFE"))
    caps["jev_remote"] = Capability(
        "jev_remote", has_key,
        "ready" if has_key else "no OPENROUTER_API_KEY / TYPESAFE_API_KEY / TYPESAFE in env",
    )
    return caps


def probe_report() -> str:
    lines = [f"host: {platform.system()}/{platform.machine()} py{sys.version.split()[0]}"]
    for cap in probe().values():
        mark = "OK  " if cap.available else "  - "
        lines.append(f"{mark}{cap.name}: {cap.reason}")
    return "\n".join(lines)


def calibrate_latency(
    call: Callable[[], Any], *, samples: int = 10, warmup: int = 2
) -> dict[str, float]:
    """Measure a backend on THIS machine. Feed the result to `Tier`.

    Warmup calls are discarded: the first call through a model pays for lazy
    weight loading and kernel compilation, and folding that into a budget makes
    every later call look like it has headroom it does not have.

    Reports p50 and p95. Budget against **p95**, not p50 -- a tier budgeted at
    its median blows its deadline half the time.
    """
    if samples < 1:
        raise ValueError("need at least one sample")
    for _ in range(max(0, warmup)):
        call()
    timings: list[float] = []
    for _ in range(samples):
        t0 = time.perf_counter()
        call()
        timings.append((time.perf_counter() - t0) * 1000.0)
    timings.sort()
    return {
        "p50": statistics.median(timings),
        "p95": timings[min(len(timings) - 1, int(round(0.95 * (len(timings) - 1))))],
        "mean": statistics.fmean(timings),
        "n": float(len(timings)),
    }


def make_jev_backend(question_name: str = "q") -> Callable[[Any, Any], Any]:
    """Adapter over the existing jev-router client.

    Imported lazily so this module stays importable (and testable) on a machine
    with no key and no network -- which is most CI.
    """

    def backend(state: Any, question: Any):
        sys.path.insert(0, "/home/user/solomons-chamber/10-Skills/jev-router/scripts")
        from jev_client import Question, ask  # noqa: PLC0415

        from cascade import Decision  # noqa: PLC0415

        result = ask(state, [Question(question_name, dict(question))])
        answer = result.answers[question_name]
        return Decision(
            choice=answer.choice,
            probabilities=dict(answer.probabilities),
            cost_usd=result.cost_usd or 0.0,
        )

    return backend


if __name__ == "__main__":
    print(probe_report())
