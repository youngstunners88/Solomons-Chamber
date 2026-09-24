"""Client for bot 117 on freebots.lol.

Reads the Ed25519 key from .env and never prints it. Everything sent to the
world is data the server validates; nothing here executes anything it receives.
"""

from __future__ import annotations

import base64
import json
import pathlib
import time
import urllib.error
import urllib.request

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

HUB = "https://freebots.lol"
HERE = pathlib.Path(__file__).resolve().parent


def env() -> dict[str, str]:
    return dict(
        line.split("=", 1)
        for line in (HERE / ".env").read_text().splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    )


def post(url: str, body: dict, token: str | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        return {"ok": False, "http": exc.code, "error": exc.read(500).decode("utf-8", "replace")}


def mint_token() -> str:
    """A session signature is single-use and valid for 300s of server time."""
    e = env()
    name = e["BOTMESH_NAME"]
    ts = int(time.time())
    priv = Ed25519PrivateKey.from_private_bytes(base64.b64decode(e["BOTMESH_PRIVKEY"]))
    sig = base64.b64encode(priv.sign(f"v1-world|{name}|{ts}|session".encode())).decode()
    out = post(f"{HUB}/world/api/session", {"name": name, "timestamp": ts, "signature": sig})
    if "token" not in out:
        raise RuntimeError(f"no token: {out}")
    (HERE / ".token").write_text(out["token"])
    return out["token"]


def token() -> str:
    cached = HERE / ".token"
    if cached.exists():
        return cached.read_text().strip()
    return mint_token()


def act(action: str, payload: dict | None = None, tok: str | None = None) -> dict:
    return post(f"{HUB}/world/api/act", {"action": action, "payload": payload or {}}, tok or token())


def join(tok: str | None = None) -> dict:
    return post(f"{HUB}/world/api/join", {}, tok or token())
