"""A two-turn confirmation gate for actions that cannot be undone.

The rule this enforces comes from Minara's trading skill, where it is written as
prose: present a confirmation summary, END the response there, and execute only
after the user replies in a *new* message. Minara's own file cannot detect a
violation of it. This module can detect most of them.

WHAT THIS ENFORCES (mechanically, with tests)

  * Execution requires a proposal that was made in a STRICTLY EARLIER turn.
    Propose-and-execute inside one turn is the single most common way the rule
    is broken, and it raises here.
  * Changing any parameter VOIDS the proposal. A confirmation is a confirmation
    of specific numbers, not of a direction of travel. The fingerprint is over
    the canonical parameters, so amount 100 -> 200 invalidates the ticket.
  * A ticket is single-use. Replaying a confirmation to run the action twice
    raises.
  * Proposals expire, by turn count and by wall clock.
  * Every outcome -- including every refusal -- lands in an append-only audit
    log with a reason code.

WHAT THIS CANNOT ENFORCE, AND WHY IT SAYS SO OUT LOUD

  It cannot prove a human actually replied. An agent that writes "User selected
  A" and calls `confirm()` produces a valid ticket, because in-process there is
  nothing to distinguish a real reply from a fabricated one. That is a property
  of the situation, not a gap to be patched with more code here.

  So the design does the next best thing: fabrication must be EXPLICIT and it
  is LOGGED. `confirm()` demands an `Attestation` that names its `source`, and
  the only way to get one without an external authority is
  `Attestation.self_asserted()`, which is spelled to be embarrassing in a diff
  and is flagged `trusted=False` in the audit record.

  Wire `source` to something the agent does not author -- an AskUserQuestion
  result, an HTTP callback, a signed webhook. Then `trusted` means something.

The gate is deliberately transport-agnostic: it knows nothing about trading,
git, or payments. An irreversible action is any action whose undo is not the
inverse of its do.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

__all__ = [
    "Attestation",
    "ConfirmationGate",
    "GateError",
    "Outcome",
    "Proposal",
    "ProposalState",
]

# A proposal older than this many turns is stale. Five is not a magic number: it
# is short enough that the summary is still on screen and long enough to survive
# a clarifying question or two in between.
DEFAULT_MAX_TURN_AGE = 5

# Wall-clock ceiling. Prices, balances and branch heads all move; a confirmation
# the user gave twenty minutes ago was given against a world that no longer
# exists.
DEFAULT_TTL_SECONDS = 600.0


class GateError(RuntimeError):
    """A refusal. Carries the reason code that was written to the audit log."""

    def __init__(self, reason: str, message: str) -> None:
        super().__init__(f"[{reason}] {message}")
        self.reason = reason


class ProposalState(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    EXECUTED = "executed"
    ABORTED = "aborted"
    VOIDED = "voided"


class Outcome(str, Enum):
    """Reason codes. Named after what happened, not after who is at fault.

    Senpi logs every blocked signal with a code like `no_slots` or `no_margin`
    rather than a bare rejection, which is what makes its telemetry mineable
    after the fact. Same idea.
    """

    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    EXECUTED = "executed"
    ABORTED = "aborted"
    REFUSED_SAME_TURN = "refused_same_turn"
    REFUSED_NO_PROPOSAL = "refused_no_proposal"
    REFUSED_NOT_CONFIRMED = "refused_not_confirmed"
    REFUSED_PARAMS_CHANGED = "refused_params_changed"
    REFUSED_REPLAY = "refused_replay"
    REFUSED_EXPIRED = "refused_expired"
    REFUSED_ABORTED = "refused_aborted"
    REFUSED_TURN_WENT_BACKWARDS = "refused_turn_went_backwards"


def fingerprint(action: str, params: dict[str, Any]) -> str:
    """A stable hash over the action and its parameters.

    `sort_keys` makes key order irrelevant; `default=str` means an unserialisable
    parameter degrades to its repr rather than raising, because a gate that
    crashes on an odd parameter type is a gate people route around.
    """
    blob = json.dumps(
        {"action": action, "params": params}, sort_keys=True, default=str
    )
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:32]


@dataclass(frozen=True)
class Attestation:
    """Evidence that a human said yes.

    `trusted` is the whole point of this type. It is True only when the yes came
    from somewhere the agent does not write.
    """

    source: str
    trusted: bool
    detail: str = ""

    @classmethod
    def from_external(cls, source: str, detail: str = "") -> "Attestation":
        """A reply from outside the agent: AskUserQuestion, a webhook, a CLI TTY."""
        if not source or not source.strip():
            raise ValueError("an external attestation must name its source")
        return cls(source=source.strip(), trusted=True, detail=detail)

    @classmethod
    def self_asserted(cls, detail: str = "") -> "Attestation":
        """The agent asserting the user agreed, with no external evidence.

        This exists so that doing it is possible to audit, not so that it is
        possible. It is never `trusted`. If this shows up in a production audit
        log, that is the finding.
        """
        return cls(source="self_asserted", trusted=False, detail=detail)


@dataclass
class Proposal:
    action: str
    params: dict[str, Any]
    proposed_turn: int
    proposal_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    # Stamped by the gate from ITS clock, never from time.monotonic() directly --
    # a default_factory here would ignore an injected clock and make every TTL
    # test measure the real uptime of the process instead of the fake timeline.
    created_at: float = 0.0
    state: ProposalState = ProposalState.PENDING
    attestation: Attestation | None = None
    summary: str = ""

    @property
    def fingerprint(self) -> str:
        return fingerprint(self.action, self.params)


@dataclass
class AuditRecord:
    outcome: Outcome
    action: str
    turn: int
    proposal_id: str | None
    fingerprint: str | None
    trusted: bool | None
    note: str
    at: float = field(default_factory=time.time)

    def as_dict(self) -> dict[str, Any]:
        return {
            "outcome": self.outcome.value,
            "action": self.action,
            "turn": self.turn,
            "proposal_id": self.proposal_id,
            "fingerprint": self.fingerprint,
            "trusted": self.trusted,
            "note": self.note,
            "at": self.at,
        }


class ConfirmationGate:
    """Holds at most one pending proposal per action name.

    Turns are supplied by the caller rather than counted internally, because the
    gate has no way to observe a conversation. Feed it a counter that increments
    once per USER message -- not per tool call, and not per assistant message.
    Getting that wrong is the one way to make the gate lie: if `turn` increments
    within a single assistant turn, the same-turn check passes when it should not.
    `assert_turn_source_is_user_messages` exists to make that explicit at the
    call site.
    """

    def __init__(
        self,
        *,
        max_turn_age: int = DEFAULT_MAX_TURN_AGE,
        ttl_seconds: float = DEFAULT_TTL_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_turn_age < 1:
            raise ValueError("max_turn_age must be at least 1 turn")
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        self.max_turn_age = max_turn_age
        self.ttl_seconds = ttl_seconds
        self._clock = clock
        self._pending: dict[str, Proposal] = {}
        self._spent: set[str] = set()
        self._highest_turn = -1
        self.audit: list[AuditRecord] = []

    # -- internals ---------------------------------------------------------

    def _log(
        self,
        outcome: Outcome,
        action: str,
        turn: int,
        proposal: Proposal | None = None,
        note: str = "",
        trusted: bool | None = None,
    ) -> None:
        self.audit.append(
            AuditRecord(
                outcome=outcome,
                action=action,
                turn=turn,
                proposal_id=proposal.proposal_id if proposal else None,
                fingerprint=proposal.fingerprint if proposal else None,
                trusted=trusted,
                note=note,
            )
        )

    def _refuse(
        self,
        outcome: Outcome,
        action: str,
        turn: int,
        message: str,
        proposal: Proposal | None = None,
    ) -> GateError:
        self._log(outcome, action, turn, proposal, note=message)
        return GateError(outcome.value, message)

    def _track_turn(self, action: str, turn: int) -> None:
        """Turns must not go backwards.

        A caller whose turn counter resets mid-session would silently re-enable
        every expiry check it had already failed, so this is a hard error rather
        than a clamp.
        """
        if turn < self._highest_turn:
            raise self._refuse(
                Outcome.REFUSED_TURN_WENT_BACKWARDS,
                action,
                turn,
                f"turn {turn} is before the highest turn seen ({self._highest_turn}); "
                "the turn counter must be monotonic",
            )
        self._highest_turn = max(self._highest_turn, turn)

    def _expired(self, proposal: Proposal, turn: int) -> str | None:
        if turn - proposal.proposed_turn > self.max_turn_age:
            return (
                f"proposal is {turn - proposal.proposed_turn} turns old "
                f"(limit {self.max_turn_age})"
            )
        age = self._clock() - proposal.created_at
        if age > self.ttl_seconds:
            return f"proposal is {age:.0f}s old (limit {self.ttl_seconds:.0f}s)"
        return None

    # -- the three verbs ---------------------------------------------------

    def propose(
        self, action: str, params: dict[str, Any], turn: int, summary: str = ""
    ) -> Proposal:
        """Record what is about to be asked. Then END THE RESPONSE.

        Replacing an existing pending proposal for the same action is allowed and
        is the correct behaviour when the user revises a parameter -- the old
        ticket becomes unusable because its fingerprint no longer matches.
        """
        self._track_turn(action, turn)
        previous = self._pending.get(action)
        if previous is not None and previous.state is ProposalState.PENDING:
            previous.state = ProposalState.VOIDED
            self._log(
                Outcome.REFUSED_PARAMS_CHANGED,
                action,
                turn,
                previous,
                note="superseded by a newer proposal for the same action",
            )
        proposal = Proposal(
            action=action,
            params=dict(params),
            proposed_turn=turn,
            summary=summary,
            created_at=self._clock(),
        )
        self._pending[action] = proposal
        self._log(Outcome.PROPOSED, action, turn, proposal, note=summary)
        return proposal

    def confirm(
        self, action: str, turn: int, attestation: Attestation, params: dict[str, Any] | None = None
    ) -> Proposal:
        """Accept the user's yes. Must be a strictly later turn than `propose`.

        Pass `params` to re-assert what is being confirmed. When supplied they
        are checked against the proposal's fingerprint, which catches the case
        where the agent's understanding of the action drifted between the summary
        and the execution.
        """
        self._track_turn(action, turn)
        proposal = self._pending.get(action)
        if proposal is None:
            raise self._refuse(
                Outcome.REFUSED_NO_PROPOSAL,
                action,
                turn,
                f"no proposal for {action!r}; a confirmation must follow a summary",
            )
        if proposal.state is ProposalState.ABORTED:
            raise self._refuse(
                Outcome.REFUSED_ABORTED, action, turn,
                f"{action!r} was aborted; propose it again", proposal,
            )
        if proposal.state is not ProposalState.PENDING:
            raise self._refuse(
                Outcome.REFUSED_REPLAY, action, turn,
                f"{action!r} is already {proposal.state.value}", proposal,
            )
        if turn <= proposal.proposed_turn:
            raise self._refuse(
                Outcome.REFUSED_SAME_TURN,
                action,
                turn,
                f"{action!r} was proposed on turn {proposal.proposed_turn} and cannot be "
                f"confirmed on turn {turn}; the summary response must end and the user "
                "must reply in a new message",
                proposal,
            )
        stale = self._expired(proposal, turn)
        if stale:
            proposal.state = ProposalState.VOIDED
            raise self._refuse(
                Outcome.REFUSED_EXPIRED, action, turn,
                f"{stale}; re-present the summary against current figures", proposal,
            )
        if params is not None and fingerprint(action, params) != proposal.fingerprint:
            proposal.state = ProposalState.VOIDED
            raise self._refuse(
                Outcome.REFUSED_PARAMS_CHANGED,
                action,
                turn,
                f"parameters for {action!r} changed since the summary; the previous "
                "confirmation is void and a fresh summary is required",
                proposal,
            )
        proposal.state = ProposalState.CONFIRMED
        proposal.attestation = attestation
        self._log(
            Outcome.CONFIRMED, action, turn, proposal,
            note=f"source={attestation.source}", trusted=attestation.trusted,
        )
        return proposal

    def execute(
        self, action: str, turn: int, run: Callable[[dict[str, Any]], Any], params: dict[str, Any] | None = None
    ) -> Any:
        """Run the action, once, only against a confirmed and unexpired ticket.

        The ticket is spent BEFORE `run` is called. If `run` raises, the ticket
        stays spent: a failed irreversible action may well have had an effect,
        and the safe assumption is that retrying doubles it rather than repairs
        it. Re-propose instead.
        """
        self._track_turn(action, turn)
        proposal = self._pending.get(action)
        if proposal is None:
            raise self._refuse(
                Outcome.REFUSED_NO_PROPOSAL, action, turn,
                f"no proposal for {action!r}",
            )
        if proposal.proposal_id in self._spent:
            raise self._refuse(
                Outcome.REFUSED_REPLAY, action, turn,
                f"{action!r} already executed under this confirmation", proposal,
            )
        if proposal.state is ProposalState.ABORTED:
            raise self._refuse(
                Outcome.REFUSED_ABORTED, action, turn,
                f"{action!r} was aborted", proposal,
            )
        if proposal.state is not ProposalState.CONFIRMED:
            raise self._refuse(
                Outcome.REFUSED_NOT_CONFIRMED, action, turn,
                f"{action!r} is {proposal.state.value}, not confirmed", proposal,
            )
        stale = self._expired(proposal, turn)
        if stale:
            proposal.state = ProposalState.VOIDED
            raise self._refuse(
                Outcome.REFUSED_EXPIRED, action, turn,
                f"{stale}; confirmation no longer current", proposal,
            )
        if params is not None and fingerprint(action, params) != proposal.fingerprint:
            proposal.state = ProposalState.VOIDED
            raise self._refuse(
                Outcome.REFUSED_PARAMS_CHANGED, action, turn,
                f"parameters for {action!r} differ from what was confirmed", proposal,
            )
        self._spent.add(proposal.proposal_id)
        proposal.state = ProposalState.EXECUTED
        self._log(
            Outcome.EXECUTED, action, turn, proposal,
            trusted=proposal.attestation.trusted if proposal.attestation else None,
        )
        return run(dict(proposal.params))

    def abort(self, action: str, turn: int, note: str = "") -> None:
        """The user said no. Idempotent -- aborting nothing is not an error."""
        self._track_turn(action, turn)
        proposal = self._pending.get(action)
        if proposal is None:
            self._log(Outcome.ABORTED, action, turn, note="nothing pending")
            return
        proposal.state = ProposalState.ABORTED
        self._log(Outcome.ABORTED, action, turn, proposal, note=note)

    # -- inspection --------------------------------------------------------

    def pending(self, action: str) -> Proposal | None:
        return self._pending.get(action)

    def untrusted_executions(self) -> list[AuditRecord]:
        """Executions that ran on a self-asserted confirmation.

        The query worth putting in CI. A non-empty result means something ran
        because the agent said the user agreed, with nothing external backing it.
        """
        return [
            r for r in self.audit
            if r.outcome is Outcome.EXECUTED and r.trusted is False
        ]

    def refusals(self) -> list[AuditRecord]:
        return [r for r in self.audit if r.outcome.value.startswith("refused_")]

    def audit_json(self) -> str:
        return json.dumps([r.as_dict() for r in self.audit], indent=1)


def assert_turn_source_is_user_messages(description: str) -> None:
    """A no-op that exists to be read at the call site.

    The gate's same-turn check is only as good as the counter fed to it. Calling
    this with a sentence naming where `turn` comes from forces the author to
    answer the question once, in writing, next to the code.
    """
    if not description or len(description.split()) < 3:
        raise ValueError(
            "state, in a sentence, what increments the turn counter -- it must be "
            "user messages, not tool calls or assistant messages"
        )
