/**
 * web/server.ts
 * Solomon's Chamber — Hono web dashboard.
 * Runs on port 4000.
 *
 * Routes:
 *   GET /             — HTML dashboard
 *   GET /api/status   — JSON state from StateStore
 *   GET /api/layers   — JSON layer definitions
 */

import { Hono } from "hono";
import { LAYERS } from "../core/layers.ts";
import { StateStore } from "../core/state.ts";

const app = new Hono();
const store = new StateStore();
const PORT = 4000;

// ---------------------------------------------------------------------------
// HTML dashboard
// ---------------------------------------------------------------------------

function renderDashboard(): string {
  const layers = LAYERS;

  const layerCards = layers
    .map((layer) => {
      const isExternal = layer.external;
      const href = isExternal ? layer.url! : `#layer-${layer.id}`;
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : "";
      const capsList = layer.capabilities
        .slice(0, 3)
        .map((c) => `<li>${c}</li>`)
        .join("\n              ");

      return `
        <div class="card" id="layer-${layer.id}">
          <div class="card-header">
            <span class="card-emoji">${layer.emoji}</span>
            <div class="card-title-group">
              <h3 class="card-title">${layer.name}</h3>
              <span class="card-path">${layer.path}</span>
            </div>
          </div>
          <p class="card-desc">${layer.description}</p>
          <ul class="card-caps">
            ${capsList}
          </ul>
          <a class="card-link" href="${href}" ${targetAttr}>→ Open</a>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solomon's Chamber</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg:         #0a0a0f;
      --surface:    #111118;
      --surface-2:  #1a1a24;
      --border:     #2a2a38;
      --accent:     #6366f1;
      --accent-dim: #4f51c5;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --text:       #e2e2f0;
      --text-muted: #8888aa;
      --text-dim:   #5555777;
      --green:      #34d399;
      --orange:     #fb923c;
      --radius:     10px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      font-size: 14px;
      line-height: 1.6;
      min-height: 100vh;
    }

    /* ── Header ── */
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-glyph {
      font-size: 28px;
      line-height: 1;
    }

    .header-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: var(--text);
    }

    .header-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .header-badge {
      background: var(--accent-glow);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }

    /* ── Quick links bar ── */
    .quick-bar {
      background: var(--surface-2);
      border-bottom: 1px solid var(--border);
      padding: 10px 32px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .quick-label {
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-right: 4px;
    }

    .quick-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      font-size: 13px;
      padding: 5px 14px;
      border-radius: var(--radius);
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }

    .quick-link:hover {
      border-color: var(--accent);
      background: var(--accent-glow);
      color: var(--accent);
    }

    .quick-link.primary {
      border-color: var(--accent);
      background: var(--accent-glow);
      color: var(--accent);
    }

    .quick-link.primary:hover {
      background: var(--accent);
      color: #fff;
    }

    /* ── Main layout ── */
    .main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px;
    }

    /* ── Section ── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    /* ── Grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }

    /* ── Cards ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .card:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent-glow), 0 4px 24px rgba(0,0,0,0.4);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .card-emoji {
      font-size: 22px;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .card-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-path {
      font-size: 11px;
      color: var(--text-muted);
      font-family: "SF Mono", "Fira Code", "Fira Mono", monospace;
    }

    .card-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
      flex: 1;
    }

    .card-caps {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .card-caps li {
      font-size: 12px;
      color: var(--text-muted);
      padding-left: 14px;
      position: relative;
    }

    .card-caps li::before {
      content: "·";
      position: absolute;
      left: 4px;
      color: var(--accent);
    }

    .card-link {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
      margin-top: 4px;
      letter-spacing: 0.3px;
      transition: color 0.15s;
    }

    .card-link:hover {
      color: #fff;
    }

    /* ── Status bar ── */
    .status-bar {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 20px;
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .status-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }

    .status-value.accent { color: var(--accent); }
    .status-value.green  { color: var(--green); }
    .status-value.orange { color: var(--orange); }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid var(--border);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      font-size: 12px;
    }

    .footer-links {
      display: flex;
      gap: 16px;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
    }

    .footer-links a:hover {
      color: var(--accent);
    }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .header { padding: 14px 16px; }
      .quick-bar { padding: 8px 16px; }
      .main { padding: 16px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="header-left">
      <span class="header-glyph">🏛️</span>
      <div>
        <div class="header-title">Solomon's Chamber</div>
        <div class="header-subtitle">Personal knowledge vault &amp; automation hub</div>
      </div>
    </div>
    <span class="header-badge">PORT 4000</span>
  </header>

  <nav class="quick-bar">
    <span class="quick-label">Quick Links</span>
    <a class="quick-link primary" href="http://104.198.196.174:3000/" target="_blank" rel="noopener noreferrer">
      📖 StoryChain
    </a>
    <a class="quick-link" href="http://104.198.196.174:3000/" target="_blank" rel="noopener noreferrer">
      🏘️ Wholesaling System
    </a>
    <a class="quick-link" href="/api/status">
      ⚡ API: Status
    </a>
    <a class="quick-link" href="/api/layers">
      🗂️ API: Layers
    </a>
  </nav>

  <main class="main">

    <div class="status-bar" id="status-bar">
      <div class="status-item">
        <span class="status-label">Dashboard</span>
        <span class="status-value green">Online</span>
      </div>
      <div class="status-item">
        <span class="status-label">Layers</span>
        <span class="status-value accent">${layers.length}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Active Projects</span>
        <span class="status-value accent">2</span>
      </div>
      <div class="status-item">
        <span class="status-label">StoryChain</span>
        <span class="status-value green">Live</span>
      </div>
      <div class="status-item">
        <span class="status-label">Port</span>
        <span class="status-value">4000</span>
      </div>
    </div>

    <p class="section-title">Vault Layers — ${layers.length} registered</p>
    <div class="grid">
      ${layerCards}
    </div>

  </main>

  <footer class="footer">
    <span>Solomon's Chamber &mdash; Personal Vault</span>
    <div class="footer-links">
      <a href="/api/status">Status API</a>
      <a href="/api/layers">Layers API</a>
      <a href="http://104.198.196.174:3000/" target="_blank">StoryChain ↗</a>
    </div>
  </footer>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/", (c) => {
  return c.html(renderDashboard());
});

app.get("/api/status", (c) => {
  try {
    const state = store.get();
    return c.json({
      ok: true,
      data: state,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

app.get("/api/layers", (c) => {
  return c.json({
    ok: true,
    count: LAYERS.length,
    data: LAYERS,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

console.log(`\n  🏛️  Solomon's Chamber dashboard`);
console.log(`  ─────────────────────────────────`);
console.log(`  URL     : http://localhost:${PORT}`);
console.log(`  Layers  : ${LAYERS.length} registered`);
console.log(`  API     : /api/status  /api/layers`);
console.log(`  StoryChain: http://104.198.196.174:3000/\n`);

export default {
  port: PORT,
  fetch: app.fetch,
};
