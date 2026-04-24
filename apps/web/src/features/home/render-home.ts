import type { ApiResult, HealthPayload } from "@olympus/shared-types";

export function renderHomePage(apiHealth: ApiResult<HealthPayload>): string {
  const statusLine = apiHealth.ok
    ? `API status: ${apiHealth.data.status} (${apiHealth.data.uptimeMs}ms)`
    : `API status: error (${apiHealth.error.code})`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Olympus Climb</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 2rem; }
      .panel { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; max-width: 560px; }
      code { background: #f4f4f4; padding: 0.125rem 0.375rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main class="panel">
      <h1>Olympus Climb</h1>
      <p>Runtime bootstrap ready for feature development.</p>
      <p>${statusLine}</p>
      <p>Try <code>/health</code> for web health and API health bridge.</p>
    </main>
  </body>
</html>`;
}
