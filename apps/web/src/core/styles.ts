/**
 * Global styles and HTML helpers for the local server-rendered web UI.
 * Keep this file dependency-free: pages must render correctly without CDN CSS.
 */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

export function jsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export const headAssets = `
  <style>
    :root {
      --bg: #07111f;
      --bg-soft: #0d1b2e;
      --panel: #102033;
      --panel-strong: #142740;
      --line: #24364e;
      --line-soft: rgba(148, 163, 184, 0.22);
      --text: #e5edf7;
      --muted: #93a4b8;
      --muted-2: #64748b;
      --brand: #38bdf8;
      --brand-strong: #0ea5e9;
      --brand-soft: rgba(56, 189, 248, 0.14);
      --ok: #22c55e;
      --warn: #f59e0b;
      --danger: #ef4444;
      --purple: #a78bfa;
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
      --radius: 18px;
    }

    * { box-sizing: border-box; }
    html { min-height: 100%; background: var(--bg); }
    body {
      min-height: 100vh;
      margin: 0;
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
      background:
        radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.18), transparent 28rem),
        radial-gradient(circle at 85% 0%, rgba(167, 139, 250, 0.16), transparent 28rem),
        linear-gradient(135deg, #07111f 0%, #091827 48%, #07111f 100%);
    }

    a { color: inherit; }
    code {
      padding: 0.15rem 0.35rem;
      border: 1px solid var(--line-soft);
      border-radius: 0.45rem;
      background: rgba(2, 6, 23, 0.45);
      color: #bae6fd;
      font-size: 0.88em;
    }

    .page-container { min-height: 100vh; display: flex; flex-direction: column; }
    .page-content { flex: 1; }
    .layout {
      width: min(1320px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 1.35rem 0 2.5rem;
      display: grid;
      gap: 1rem;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(7, 17, 31, 0.9);
      backdrop-filter: blur(14px);
    }
    .topbar-inner {
      width: min(1320px, calc(100% - 2rem));
      min-height: 4.35rem;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .brand-block { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .brand-mark {
      width: 2.35rem;
      height: 2.35rem;
      display: grid;
      place-items: center;
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 0.9rem;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(167, 139, 250, 0.18));
      box-shadow: 0 12px 40px rgba(56, 189, 248, 0.12);
      font-weight: 900;
      color: #e0f2fe;
    }
    .brand-name { margin: 0; font-size: 1.05rem; letter-spacing: -0.02em; }
    .brand-context { color: var(--muted); font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-nav { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end; }
    .nav-link,
    .route-btn,
    .btn,
    .btn-primary,
    .btn-secondary,
    .btn-danger,
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      min-height: 2.25rem;
      padding: 0.55rem 0.8rem;
      border: 1px solid var(--line-soft);
      border-radius: 0.75rem;
      background: rgba(15, 30, 48, 0.78);
      color: var(--text);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    }
    .nav-link:hover,
    .route-btn:hover,
    .btn:hover,
    .btn-primary:hover,
    .btn-secondary:hover,
    .btn-danger:hover,
    button:hover { transform: translateY(-1px); border-color: rgba(56, 189, 248, 0.45); background: rgba(20, 39, 64, 0.92); }
    .nav-link.active { border-color: rgba(56, 189, 248, 0.55); background: var(--brand-soft); color: #dff7ff; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--line-soft);
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.32);
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
    }
    .status-dot { width: 0.55rem; height: 0.55rem; border-radius: 999px; background: var(--danger); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12); }
    .status-dot.ok { background: var(--ok); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12); }

    .breadcrumb {
      width: min(1320px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 0.8rem 0 0;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--muted);
      font-size: 0.82rem;
    }
    .breadcrumb a { color: #bae6fd; text-decoration: none; }
    .breadcrumb-separator { color: var(--muted-2); }

    .panel {
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(16, 32, 51, 0.92), rgba(12, 25, 41, 0.92));
      box-shadow: var(--shadow);
      padding: 1.15rem;
    }
    .panel.tight { padding: 0; overflow: hidden; }
    .section-header,
    .panel-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.9rem;
    }
    .panel h2,
    .panel h3 { margin: 0; letter-spacing: -0.02em; }
    .panel h2 { font-size: 1.12rem; }
    .panel h3 { font-size: 0.98rem; }
    .subtle { color: var(--muted); font-size: 0.9rem; margin: 0.25rem 0 0; }

    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.8rem; }
    .metric-card,
    .card-stat {
      min-height: 6.8rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.7rem;
      border: 1px solid var(--line-soft);
      border-radius: 1rem;
      background: rgba(2, 6, 23, 0.28);
      padding: 0.9rem;
    }
    .metric-label { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: var(--muted); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .metric-value { font-size: 1.9rem; font-weight: 900; letter-spacing: -0.04em; color: #7dd3fc; }

    .info-icon {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: 1.15rem;
      height: 1.15rem;
      border: 1px solid rgba(125, 211, 252, 0.45);
      border-radius: 999px;
      color: #bae6fd;
      font-size: 0.72rem;
      font-weight: 900;
      cursor: help;
      flex: 0 0 auto;
    }
    .info-icon::after {
      content: attr(data-tooltip);
      position: absolute;
      z-index: 50;
      left: 50%;
      bottom: calc(100% + 0.55rem);
      width: max-content;
      max-width: 18rem;
      transform: translateX(-50%);
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--line-soft);
      border-radius: 0.65rem;
      background: #020617;
      color: var(--text);
      box-shadow: var(--shadow);
      font-size: 0.78rem;
      font-weight: 600;
      line-height: 1.35;
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease;
    }
    .info-icon:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
    }
    .info-icon:hover::after,
    .info-icon:focus::after,
    .info-icon:focus-visible::after { opacity: 1; }

    form { margin: 0; }
    .form-grid { display: grid; gap: 0.85rem; }
    .form-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { display: grid; gap: 0.35rem; color: var(--text); font-weight: 700; font-size: 0.88rem; }
    .label-row { display: inline-flex; align-items: center; gap: 0.35rem; }
    input,
    textarea,
    select,
    .input-base {
      width: 100%;
      min-height: 2.45rem;
      border: 1px solid var(--line-soft);
      border-radius: 0.75rem;
      background: rgba(2, 6, 23, 0.34);
      color: var(--text);
      padding: 0.65rem 0.75rem;
      font: inherit;
      font-size: 0.9rem;
    }
    textarea { resize: vertical; }
    input:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: rgba(56, 189, 248, 0.75);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
    }
    option { color: #0f172a; }
    .btn-primary,
    .primary { background: linear-gradient(135deg, var(--brand-strong), #2563eb); color: white; border-color: transparent; }
    .btn-secondary,
    .secondary { background: rgba(15, 30, 48, 0.82); color: var(--text); }
    .btn-danger,
    .danger { background: rgba(239, 68, 68, 0.12); color: #fecaca; border-color: rgba(239, 68, 68, 0.28); }
    .btn-small { min-height: 1.85rem; padding: 0.25rem 0.5rem; font-size: 0.76rem; border-radius: 0.55rem; }
    .actions-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    .route-grid { display: flex; flex-wrap: wrap; gap: 0.55rem; }
    .route-btn { color: #dff7ff; }
    .route-btn.disabled,
    .route-action-disabled { opacity: 0.52; cursor: default; transform: none; }
    .route-method { font-size: 0.72rem; font-weight: 900; color: #bae6fd; }

    .table-wrap { overflow-x: auto; border: 1px solid var(--line-soft); border-radius: 1rem; }
    table,
    .table-base { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th,
    .table-base th {
      padding: 0.75rem;
      text-align: left;
      color: var(--muted);
      background: rgba(2, 6, 23, 0.24);
      border-bottom: 1px solid var(--line-soft);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    td,
    .table-base td { padding: 0.75rem; border-bottom: 1px solid rgba(148, 163, 184, 0.12); color: var(--text); vertical-align: top; }
    tr:last-child td { border-bottom: 0; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      width: fit-content;
      padding: 0.18rem 0.45rem;
      border: 1px solid var(--line-soft);
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.1);
      color: #dbeafe;
      font-size: 0.73rem;
      font-weight: 800;
    }
    .badge.ok { color: #bbf7d0; background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.28); }
    .badge.warn { color: #fde68a; background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.28); }
    .badge.danger { color: #fecaca; background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.28); }
    .badge.brand { color: #bae6fd; background: rgba(56, 189, 248, 0.12); border-color: rgba(56, 189, 248, 0.28); }

    .split-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .stack { display: grid; gap: 0.75rem; }
    .empty { color: var(--muted); font-style: italic; margin: 0; }
    .muted { color: var(--muted); }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .truncate { max-width: 24rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

    .job-list { display: grid; gap: 0.75rem; }
    .job-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.9rem;
      align-items: start;
      border: 1px solid var(--line-soft);
      border-left: 4px solid var(--line);
      border-radius: 1rem;
      background: rgba(2, 6, 23, 0.24);
      padding: 0.9rem;
    }
    .job-card.high { border-left-color: var(--ok); }
    .job-card.mid { border-left-color: var(--warn); }
    .job-card.low { border-left-color: var(--muted-2); }
    .score-box { min-width: 4.2rem; text-align: center; }
    .score-value { display: block; font-size: 1.45rem; font-weight: 900; letter-spacing: -0.04em; }
    .score-value.high { color: #86efac; }
    .score-value.mid { color: #fcd34d; }
    .score-value.low { color: var(--muted); }
    .job-title { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; font-size: 1rem; font-weight: 900; }
    .job-meta { color: var(--muted); font-size: 0.84rem; margin-top: 0.2rem; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.55rem; }
    .tag-control { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.55rem; }
    .tag-input { width: 8rem; min-height: 1.95rem; padding: 0.35rem 0.5rem; font-size: 0.8rem; border-radius: 0.55rem; }
    .job-actions { display: grid; gap: 0.4rem; min-width: 8rem; }
    .deep-score-box { display: none; grid-column: 1 / -1; border: 1px dashed rgba(167, 139, 250, 0.45); border-radius: 0.85rem; background: rgba(167, 139, 250, 0.1); color: #ddd6fe; padding: 0.75rem; font-size: 0.86rem; }
    .deep-score-box.visible { display: block; }

    details.panel { padding: 0; overflow: visible; }
    details.panel > summary { list-style: none; padding: 1rem 1.15rem; cursor: pointer; }
    details.panel > summary::-webkit-details-marker { display: none; }
    details.panel > .details-body { border-top: 1px solid var(--line-soft); padding: 1.15rem; }

    .flash-wrap { width: min(1320px, calc(100% - 2rem)); margin: 1rem auto 0; display: grid; gap: 0.6rem; }
    .flash { display: flex; align-items: center; gap: 0.6rem; border-radius: 0.9rem; border: 1px solid var(--line-soft); padding: 0.75rem 0.9rem; background: rgba(2, 6, 23, 0.32); font-weight: 700; }
    .flash.success { border-color: rgba(34, 197, 94, 0.32); color: #bbf7d0; }
    .flash.error { border-color: rgba(239, 68, 68, 0.32); color: #fecaca; }
    .flash.info { border-color: rgba(56, 189, 248, 0.32); color: #bae6fd; }

    .footer { margin-top: auto; border-top: 1px solid var(--line-soft); color: var(--muted); background: rgba(7, 17, 31, 0.72); }
    .footer-inner { width: min(1320px, calc(100% - 2rem)); margin: 0 auto; padding: 1rem 0; display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; font-size: 0.78rem; }

    @media (max-width: 840px) {
      .topbar-inner { align-items: flex-start; flex-direction: column; padding: 0.85rem 0; }
      .top-nav { justify-content: flex-start; }
      .form-grid.two,
      .split-grid { grid-template-columns: 1fr; }
      .job-card { grid-template-columns: 1fr; }
      .job-actions { display: flex; flex-wrap: wrap; min-width: 0; }
      .truncate { max-width: 14rem; }
    }

    .tab-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--line-soft);
    }
    .tab-btn {
      background: rgba(2, 6, 23, 0.28);
      border: 1px solid var(--line-soft);
      border-radius: 0.65rem;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.4rem 0.75rem;
      min-height: 2rem;
      cursor: pointer;
      transition: all 160ms ease;
    }
    .tab-btn:hover { border-color: rgba(56,189,248,0.4); color: var(--text); transform: translateY(-1px); }
    .tab-btn.active { background: var(--brand-soft); border-color: rgba(56,189,248,0.55); color: #dff7ff; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
  </style>
`;

export function renderHeader(
  title: string,
  apiStatus: "ok" | "error",
  apiTime?: number,
  currentRoute?: string
): string {
  const statusText = apiStatus === "ok" ? "Online" : "Offline";
  const statusExtra = apiTime === undefined ? "" : ` (${escapeHtml(apiTime)}ms)`;
  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Workspace", href: "/workspace" },
    { label: "Como usar", href: "/guide" },
    { label: "Health", href: "/health" }
  ];

  return `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand-block">
          <div class="brand-mark">OC</div>
          <div>
            <h1 class="brand-name">Olympus Climb</h1>
            <div class="brand-context">${escapeHtml(title)}</div>
          </div>
        </div>
        <nav class="top-nav" aria-label="Navegacao principal">
          ${navItems
            .map((item) => {
              const active = currentRoute === item.href ? " active" : "";
              return `<a class="nav-link${active}" href="${escapeAttr(item.href)}">${escapeHtml(item.label)}</a>`;
            })
            .join("")}
          <span class="status-pill"><span class="status-dot ${apiStatus === "ok" ? "ok" : ""}"></span>API: ${statusText}${statusExtra}</span>
        </nav>
      </div>
    </header>
  `;
}

export function renderBreadcrumb(items: Array<{ label: string; href?: string }>): string {
  if (items.length === 0) return "";
  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${items
        .map((item, index) => {
          const label = escapeHtml(item.label);
          const content = item.href ? `<a href="${escapeAttr(item.href)}">${label}</a>` : `<span>${label}</span>`;
          const separator = index === items.length - 1 ? "" : `<span class="breadcrumb-separator">/</span>`;
          return `${content}${separator}`;
        })
        .join("")}
    </nav>
  `;
}

export function renderInfoIcon(tooltip: string): string {
  return `<span class="info-icon" data-tooltip="${escapeAttr(tooltip)}" aria-label="${escapeAttr(tooltip)}" tabindex="0">i</span>`;
}

export function renderFlash(messages: Array<{ type: "success" | "error" | "info"; text: string }>): string {
  if (!messages.length) return "";
  const flashes = messages
    .map((msg) => `<div class="flash ${escapeAttr(msg.type)}"><strong>${msg.type.toUpperCase()}</strong><span>${escapeHtml(msg.text)}</span></div>`)
    .join("");
  return `<div class="flash-wrap">${flashes}</div>`;
}

export function renderFooter(): string {
  const now = new Date().toISOString();
  return `
    <footer class="footer">
      <div class="footer-inner">
        <span><strong>Olympus Climb</strong> - agentic job matching alpha</span>
        <span>Generated: ${escapeHtml(now)}</span>
      </div>
    </footer>
  `;
}
