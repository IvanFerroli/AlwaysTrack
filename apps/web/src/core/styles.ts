/**
 * Global Styles & Component Templates
 * Centralized CSS classes + HTML component builders
 */

export const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f5f5f5;
    color: #333;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }

  html, body { height: 100%; }

  /* Layout */
  .page-container { display: flex; flex-direction: column; min-height: 100vh; }
  .page-header { background: #fff; border-bottom: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .page-content { flex: 1; overflow-y: auto; }
  .page-footer { background: #f0f0f0; border-top: 1px solid #ddd; padding: 1rem 2rem; font-size: 0.85rem; color: #666; }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 2rem;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }

  .header-title h1 {
    font-size: 1.5rem;
    margin: 0;
    color: #1f2937;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }

  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s infinite;
  }

  .status-indicator.error {
    background: #ef4444;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  /* Navigation */
  .header-nav {
    display: flex;
    gap: 1rem;
    list-style: none;
  }

  .header-nav a {
    text-decoration: none;
    color: #0066cc;
    font-size: 0.95rem;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .header-nav a:hover {
    background: #f0f0ff;
    color: #0052a3;
  }

  .header-nav a.active {
    background: #e0e7ff;
    color: #0052a3;
    font-weight: 600;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    background: #fafafa;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
    color: #666;
  }

  .breadcrumb a {
    color: #0066cc;
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb span {
    color: #999;
    margin: 0 0.25rem;
  }

  /* Main content wrapper */
  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Panel / Card */
  .panel, .card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s;
  }

  .panel:hover, .card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .panel h2, .card h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #1f2937;
  }

  /* Cards Grid */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .card-stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-stat strong {
    font-size: 1.5rem;
    color: #0066cc;
  }

  .card-stat span {
    font-size: 0.85rem;
    color: #666;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }

  thead { background: #f8f8f8; }

  th {
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #ddd;
    color: #1f2937;
  }

  td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #eee;
    color: #333;
  }

  tr:hover {
    background: #f9f9f9;
  }

  /* Forms */
  form { display: grid; gap: 1rem; }

  label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: #1f2937;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  input[type="checkbox"], input[type="radio"] {
    width: auto;
    margin-right: 0.5rem;
  }

  /* Buttons */
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #333;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  button:hover {
    background: #f8f8f8;
    border-color: #999;
  }

  button.primary {
    background: #0066cc;
    color: #fff;
    border-color: #0066cc;
  }

  button.primary:hover {
    background: #0052a3;
    border-color: #0052a3;
  }

  button.success {
    background: #22c55e;
    color: #fff;
    border-color: #22c55e;
  }

  button.success:hover {
    background: #16a34a;
    border-color: #16a34a;
  }

  button.danger {
    background: #ef4444;
    color: #fff;
    border-color: #ef4444;
  }

  button.danger:hover {
    background: #dc2626;
    border-color: #dc2626;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Info Icon */
  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #e0e7ff;
    border: 1px solid #0066cc;
    border-radius: 50%;
    color: #0066cc;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: help;
    position: relative;
    margin-left: 0.25rem;
  }

  .info-icon:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #fff;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: normal;
    white-space: nowrap;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  /* Flash Messages */
  .flash-container {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .flash {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border-left: 4px solid;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flash.success {
    background: #e9f7ef;
    border-left-color: #22c55e;
    color: #1b4332;
  }

  .flash.error {
    background: #fde8e8;
    border-left-color: #ef4444;
    color: #7f1d1d;
  }

  .flash.info {
    background: #e0e7ff;
    border-left-color: #0066cc;
    color: #0052a3;
  }

  .flash strong {
    font-weight: 600;
  }

  .flash button {
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
  }

  /* Route Grid */
  .route-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .route-btn {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    text-align: center;
    background: #f8fafc;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    color: #0066cc;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 80px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .route-btn:hover {
    background: #eef2ff;
    border-color: #0066cc;
    box-shadow: 0 2px 4px rgba(0, 102, 204, 0.1);
  }

  .route-btn small {
    font-size: 0.75rem;
    color: #666;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .layout { padding: 1rem; }
    .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .header-nav { flex-wrap: wrap; }
    table { font-size: 0.85rem; }
    .cards { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  }
`;

/**
 * HTML Component Builders
 */

export function renderHeader(
  title: string,
  apiStatus: 'ok' | 'error',
  apiTime?: number,
  currentRoute?: string
): string {
  const statusClass = apiStatus === 'ok' ? '' : 'error';
  const statusText = apiStatus === 'ok' ? '✓ Online' : '✗ Offline';
  const timeStr = apiTime ? ` (${apiTime}ms)` : '';

  return `
    <header class="page-header">
      <div class="header">
        <div class="header-title">
          <h1>🏔️ Olympus Climb</h1>
          <span class="info-icon" data-tooltip="${title}">i</span>
        </div>
        <nav class="header-nav">
          <a href="/" class="${currentRoute === '/' ? 'active' : ''}">Dashboard</a>
          <a href="/workspace" class="${currentRoute === '/workspace' ? 'active' : ''}">Workspace</a>
          <a href="/health" class="${currentRoute === '/health' ? 'active' : ''}">Health</a>
          <a href="/guide" class="${currentRoute === '/guide' ? 'active' : ''}">Como Usar</a>
        </nav>
        <div class="header-status">
          <span class="status-indicator ${statusClass}"></span>
          <span>API: ${statusText}${timeStr}</span>
        </div>
      </div>
    </header>
  `;
}

export function renderBreadcrumb(items: Array<{ label: string; href?: string }>): string {
  const crumbs = items
    .map((item) => {
      if (item.href) {
        return `<a href="${item.href}">${item.label}</a>`;
      }
      return `<span class="current">${item.label}</span>`;
    })
    .join(`<span> / </span>`);

  return `<nav class="breadcrumb">${crumbs}</nav>`;
}

export function renderInfoIcon(tooltip: string): string {
  return `<span class="info-icon" data-tooltip="${tooltip}">i</span>`;
}

export function renderFlash(messages: Array<{ type: 'success' | 'error' | 'info'; text: string }>): string {
  if (!messages.length) return '';

  const flashes = messages
    .map(
      (msg) =>
        `<div class="flash ${msg.type}">
        <strong>${msg.text}</strong>
      </div>`
    )
    .join('');

  return `<div class="flash-container">${flashes}</div>`;
}

export function renderFooter(): string {
  const now = new Date().toISOString();
  return `
    <footer class="page-footer">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Olympus Climb</strong> • Engineering Pipeline v0.1.0
        </div>
        <div>
          Generated: ${now}
        </div>
      </div>
    </footer>
  `;
}
