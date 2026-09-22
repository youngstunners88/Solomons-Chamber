"""Refuse to run a command that will hang waiting for a human.

From Minara's anti-loop guide, which exists because of a specific failure:

  "If a command drops into an interactive menu or REPL in a non-TTY environment,
   it will hang silently -- the agent appears stuck and the user gets no
   response."

The agent then retries, hangs again, and burns the session. Minara's mitigation
is four prose rules: pass every flag upfront, retry at most once, treat 15
seconds of silence as a hang, never run a bare interactive command when a
non-interactive form exists.

Prose cannot check itself, so this is the checkable part. Register what makes a
command block, and `preflight` refuses the invocation before it is spawned
rather than after it has wedged.

The retry budget is separate and equally mechanical: Minara's "max 1 retry" is
a counter, and a counter belongs in code.
"""

from __future__ import annotations

import shlex
from dataclasses import dataclass, field
from typing import Iterable, Sequence

__all__ = [
    "CommandSpec",
    "HangRisk",
    "PreflightError",
    "RetryBudget",
    "Registry",
    "DEFAULT_HANG_SECONDS",
]

# Minara's number. A command that has produced nothing for this long in a
# non-TTY context is waiting for input that will never arrive.
DEFAULT_HANG_SECONDS = 15.0


class PreflightError(RuntimeError):
    def __init__(self, reason: str, message: str) -> None:
        super().__init__(f"[{reason}] {message}")
        self.reason = reason


@dataclass(frozen=True)
class HangRisk:
    verdict: str          # "safe" | "needs_flags" | "pty_required" | "unknown"
    missing: tuple[str, ...] = ()
    advice: str = ""

    @property
    def safe(self) -> bool:
        return self.verdict == "safe"


@dataclass(frozen=True)
class CommandSpec:
    """What makes one command block.

    `required_flags`   without these it drops into a prompt.
    `always_interactive` no flag combination avoids the TUI; it needs a real pty
                       and a human. Minara's `limit-order create` is the example:
                       "This command has no non-interactive mode."
    `alternative`      the non-interactive form to use instead, if one exists.
    """

    name: str
    required_flags: tuple[str, ...] = ()
    always_interactive: bool = False
    alternative: str = ""
    note: str = ""


class Registry:
    """A per-tool table of what blocks. Deliberately explicit.

    An unregistered command returns `unknown` rather than `safe`. Defaulting to
    safe would mean the first time anyone forgets to register something, the
    guard silently stops guarding -- the same permissive-default trap that
    router.py refuses by raising on an unknown action.
    """

    def __init__(self, specs: Iterable[CommandSpec] = ()) -> None:
        self._specs: dict[str, CommandSpec] = {}
        for s in specs:
            self.register(s)

    def register(self, spec: CommandSpec) -> None:
        if spec.always_interactive and spec.required_flags:
            raise ValueError(
                f"{spec.name!r} is marked always_interactive but also lists "
                "required_flags; if flags fix it, it is not always interactive"
            )
        self._specs[spec.name] = spec

    def spec_for(self, argv: Sequence[str]) -> CommandSpec | None:
        """Longest-prefix match, so `perps close` beats `perps`."""
        best: CommandSpec | None = None
        best_len = -1
        for name, spec in self._specs.items():
            parts = name.split()
            if len(parts) > len(argv):
                continue
            if list(argv[: len(parts)]) == parts and len(parts) > best_len:
                best, best_len = spec, len(parts)
        return best

    def inspect(self, command: str) -> HangRisk:
        argv = shlex.split(command)
        if not argv:
            raise PreflightError("empty_command", "nothing to run")
        spec = self.spec_for(argv)
        if spec is None:
            return HangRisk(
                verdict="unknown",
                advice=(
                    f"{argv[0]!r} is not registered. Register a CommandSpec for it "
                    "or confirm by hand that it cannot prompt."
                ),
            )
        if spec.always_interactive:
            return HangRisk(
                verdict="pty_required",
                advice=spec.note
                or f"{spec.name!r} has no non-interactive form; drive it with a real pty.",
            )
        supplied = {a.split("=", 1)[0] for a in argv if a.startswith("-")}
        missing = tuple(f for f in spec.required_flags if f not in supplied)
        if missing:
            return HangRisk(
                verdict="needs_flags",
                missing=missing,
                advice=(
                    f"{spec.name!r} prompts without {', '.join(missing)}. "
                    + (f"Use: {spec.alternative}" if spec.alternative else
                       "Gather the values from the user first, then run it once.")
                ),
            )
        return HangRisk(verdict="safe")

    def preflight(self, command: str, *, allow_pty: bool = False) -> HangRisk:
        """Raise unless the command can run without blocking.

        `allow_pty=True` is the caller stating they have a real terminal and will
        drive the prompts. It permits `pty_required`; it never excuses missing
        flags, because those have a non-interactive answer.
        """
        risk = self.inspect(command)
        if risk.safe:
            return risk
        if risk.verdict == "pty_required" and allow_pty:
            return risk
        raise PreflightError(risk.verdict, risk.advice)



@dataclass
class RetryBudget:
    """Minara's "max 1 retry", as a counter that cannot be talked out of.

    `hang_seconds` is carried here so the caller reads one number rather than
    inventing its own timeout. A tick that produced no output for longer than
    this is a hang, and a hang is NOT retryable -- retrying a command that is
    waiting for input just waits again.
    """

    limit: int = 1
    hang_seconds: float = DEFAULT_HANG_SECONDS
    attempts: int = 0
    failures: list[str] = field(default_factory=list)

    def record_failure(self, note: str) -> None:
        self.attempts += 1
        self.failures.append(note)

    def may_retry(self) -> bool:
        return self.attempts <= self.limit

    def check(self) -> None:
        if not self.may_retry():
            raise PreflightError(
                "retry_exhausted",
                f"{self.attempts} failures, limit {self.limit}. Stop and report "
                f"to the user: {'; '.join(self.failures)}",
            )

    def is_hang(self, seconds_since_output: float) -> bool:
        return seconds_since_output >= self.hang_seconds

    def record_hang(self, command: str) -> None:
        """A hang ends the attempt sequence immediately.

        Kill the process, do not retry. Minara is explicit about this and it is
        the difference between one wasted call and an infinite loop.
        """
        self.attempts = self.limit + 1
        self.failures.append(f"hung with no output: {command}")
        raise PreflightError(
            "hang_detected",
            f"{command!r} produced no output for {self.hang_seconds:.0f}s in a "
            "non-TTY context. Kill it and do not retry -- supply the missing "
            "flags or drive it with a pty.",
        )
