"""Tests for the Alexandria research lane.

Network-free: every test exercises key selection, result shaping and the
absence check. The live behaviour is recorded in SKILL.md with the receipts.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import alexandria as a  # noqa: E402


def test_prefers_the_key_that_actually_works(monkeypatch):
    """FIRECRAWL_API_KEY was present AND stale; FIRECRAWL authenticated.

    The longer, more official-looking name is the dead one, so preference
    order is measured rather than guessed.
    """
    monkeypatch.setenv("FIRECRAWL", "working")
    monkeypatch.setenv("FIRECRAWL_API_KEY", "stale")
    assert a.api_key() == "working"


def test_falls_back_to_the_other_name(monkeypatch):
    monkeypatch.delenv("FIRECRAWL", raising=False)
    monkeypatch.setenv("FIRECRAWL_API_KEY", "only-one")
    assert a.api_key() == "only-one"


def test_blank_key_is_treated_as_absent(monkeypatch):
    monkeypatch.setenv("FIRECRAWL", "   ")
    monkeypatch.setenv("FIRECRAWL_API_KEY", "real")
    assert a.api_key() == "real"


def test_missing_key_names_the_variables_not_the_value(monkeypatch):
    for name in a.KEY_ENV_VARS:
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(a.AlexandriaError) as excinfo:
        a.api_key()
    msg = str(excinfo.value)
    assert "FIRECRAWL" in msg
    assert "stale" in msg


def test_absence_of_capability_is_detectable():
    """`tools: []` is how Alexandria says it does not cover something.

    That is an absence, and absences have to be looked for. A crypto/on-chain
    query returns exactly this shape.
    """
    assert a.has_capability_for({"tools": []}) is False
    assert a.has_capability_for({}) is False
    assert a.has_capability_for({"tools": [{"provider": "github-com"}]}) is True


def test_web_hits_are_never_mistaken_for_capabilities():
    """`tools` and `web` are different things: what you COULD call vs what was
    found. Conflating them would report coverage that does not exist."""
    data = {"tools": [], "web": [{"url": "https://example.com", "title": "x"}]}
    assert a.tools_from(data) == []
    assert a.has_capability_for(data) is False


def test_tools_from_ignores_malformed_entries():
    assert a.tools_from({"tools": ["not-a-dict", {"provider": "p"}]}) == [{"provider": "p"}]


def test_key_env_order_is_pinned():
    """If someone reorders these, the stale key wins again and everything 401s."""
    assert a.KEY_ENV_VARS[0] == "FIRECRAWL"
