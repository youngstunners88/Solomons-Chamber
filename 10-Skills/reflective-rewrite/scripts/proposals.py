"""The night model proposes. It never deploys.

On 4 May 2026 a reply to Grok in Morse code was decoded into English, and a
finance agent downstream executed it as an instruction: ~$175,000 gone, no
exploit, no stolen key. That agent had once had a hard block on
Grok-originated replies. It was dropped in a maintenance rewrite.

Two lessons, both enforced here:

1. Anything that can change how a system acts gets a human or a test between
   the idea and the change. The rewriter writes a PROPOSAL. Only `approve()`
   makes a new live version, and it refuses the proposer, any model
   identity, and any approver not on the list.
2. A guard that nothing tests is a guard that a rewrite can quietly drop.
   Every refusal here has a test that fails if it is removed.

Versions are append-only and never edited: a bad rewrite is rolled back by
approving the old text as a new version, so history keeps what actually ran.
"""
from __future__ import annotations

import difflib
import hashlib
import re
from dataclasses import dataclass, field
from typing import Callable

__all__ = ["ProposalError", "Proposal", "Version", "Registry", "screen"]


class ProposalError(RuntimeError):
    pass


# Things instruction text for a decision model has no business containing.
# A proposal matching any of these is refused outright, not sanitised: text
# that tries to smuggle an address or a transfer into the rules is evidence
# about its source, and editing it into something acceptable hides that.
_INJECTION = [
    (re.compile(r"0x[0-9a-fA-F]{40}"), "an EVM address"),
    (re.compile(r"\b[1-9A-HJ-NP-Za-km-z]{32,44}\b"), "a base58 address or key"),
    (re.compile(r"(?:0x)?[0-9a-fA-F]{64}"), "a 32-byte hex secret"),
    (re.compile(r"https?://", re.I), "a URL"),
    (re.compile(r"\b(?:transfer|withdraw|send|sweep|approve|sign)\b\s+(?:all|funds|tokens|\d)", re.I), "a movement-of-funds instruction"),
    (re.compile(r"ignore (?:all |any )?(?:previous|prior|above)", re.I), "an instruction override"),
    (re.compile(r"^[\s.\-/]{12,}$", re.M), "an encoded payload (Morse-like line)"),
]


def screen(text: str) -> list[str]:
    """Reasons a proposed instruction text must be refused. Empty = clean."""
    return [why for pat, why in _INJECTION if pat.search(text)]


@dataclass(frozen=True)
class Version:
    n: int
    text: str
    sha256: str
    approved_by: str
    from_proposal: str | None


@dataclass(frozen=True)
class Proposal:
    id: str
    text: str
    author: str
    evidence: str
    base_version: int


@dataclass
class Registry:
    approvers: frozenset[str]
    model_identities: frozenset[str]
    versions: list[Version] = field(default_factory=list)
    proposals: dict[str, Proposal] = field(default_factory=dict)
    decided: set[str] = field(default_factory=set)

    def __post_init__(self) -> None:
        if not self.approvers:
            raise ProposalError("a registry with no approvers can only ever be changed by nobody -- or by a bypass")
        overlap = self.approvers & self.model_identities
        if overlap:
            raise ProposalError(f"a model cannot be an approver: {sorted(overlap)}")

    # -- reading -------------------------------------------------------------
    def live(self) -> Version:
        if not self.versions:
            raise ProposalError("no live version; seed one with bootstrap()")
        return self.versions[-1]

    def diff(self, proposal_id: str) -> str:
        p = self.proposals[proposal_id]
        base = self.versions[p.base_version - 1].text
        return "".join(difflib.unified_diff(base.splitlines(True), p.text.splitlines(True),
                                            f"v{p.base_version}", proposal_id))

    # -- writing -------------------------------------------------------------
    def bootstrap(self, text: str, by: str) -> Version:
        if self.versions:
            raise ProposalError("already bootstrapped; changes go through propose/approve")
        return self._append(text, by, None)

    def propose(self, text: str, author: str, evidence: str) -> Proposal:
        """Anyone -- including a model -- may propose. Proposing changes nothing live."""
        reasons = screen(text)
        if reasons:
            raise ProposalError(f"proposal refused, it contains {', '.join(reasons)}")
        if not evidence.strip():
            raise ProposalError("a proposal must cite the disagreements it answers")
        base = self.live()
        if text == base.text:
            raise ProposalError("proposal is identical to the live version")
        pid = f"p{len(self.proposals) + 1}"
        p = Proposal(pid, text, author, evidence, base.n)
        self.proposals[pid] = p
        return p

    def approve(self, proposal_id: str, approver: str,
                test: Callable[[str], bool] | None = None) -> Version:
        p = self.proposals.get(proposal_id)
        if p is None:
            raise ProposalError(f"no proposal {proposal_id}")
        if proposal_id in self.decided:
            raise ProposalError(f"{proposal_id} already decided")
        if approver in self.model_identities:
            raise ProposalError(f"{approver} is a model; a model never approves")
        if approver not in self.approvers:
            raise ProposalError(f"{approver} is not an approver")
        if approver == p.author:
            raise ProposalError("the author of a proposal cannot approve it")
        if p.base_version != self.live().n:
            raise ProposalError(
                f"{proposal_id} was written against v{p.base_version}; live is v{self.live().n}. "
                "Re-propose against the current version rather than overwriting it.")
        # Screened again at approval: the rules could have tightened since.
        reasons = screen(p.text)
        if reasons:
            raise ProposalError(f"refused at approval, it contains {', '.join(reasons)}")
        if test is not None and not test(p.text):
            raise ProposalError(f"{proposal_id} failed its approval test")
        self.decided.add(proposal_id)
        return self._append(p.text, approver, proposal_id)

    def reject(self, proposal_id: str) -> None:
        if proposal_id not in self.proposals:
            raise ProposalError(f"no proposal {proposal_id}")
        self.decided.add(proposal_id)

    def _append(self, text: str, by: str, pid: str | None) -> Version:
        v = Version(len(self.versions) + 1, text, hashlib.sha256(text.encode()).hexdigest(), by, pid)
        self.versions.append(v)
        return v
