# AlwaysTrack HTTP perimeter

Status: implemented for TASK-AT-103, TASK-AT-105 and TASK-AT-106 on 2026-06-17.

## Security headers

The API and SPA nginx config send the same baseline browser protections:

- `Content-Security-Policy`: restricts scripts, objects, frames and default resource loading to the app itself.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'`: prevent clickjacking through hidden iframes.
- `X-Content-Type-Options: nosniff`: prevents browsers from guessing a different file type.
- `Referrer-Policy: no-referrer`: avoids leaking internal URLs to other sites.
- `Permissions-Policy`: disables browser capabilities the product does not need by default.
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`: reduce cross-site window/resource exposure.

The nginx CSP allows `connect-src 'self' https:` so production deployments can point the SPA at an HTTPS API without rebuilding nginx. The API CSP is tighter because API responses should not load browser assets.

## CORS and origin protection

Set `CORS_ORIGIN` to the trusted browser origins. Multiple origins can be comma-separated:

```bash
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

For browser CORS, only matching origins receive:

- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials: true`
- approved methods and headers

Unexpected preflight requests receive `403 ORIGIN_NOT_ALLOWED`.

For CSRF-style protection, every `POST`, `PATCH`, `PUT` and `DELETE` route must present a trusted `Origin` or `Referer` in production. Local development also accepts loopback origins and permits missing origins so curl and local scripts remain usable.

Public mutation exceptions are intentionally narrow:

- `POST /v1/webhooks/meta-whatsapp`
- `POST /v1/public-help/wa-link`
- `POST /v1/public-upload/:token`

OAuth callbacks and health checks are safe-method routes and are not blocked by the mutating-origin guard.

## Rate limits

The initial limiter is in-memory per API process. It is suitable for local, demo and single-instance production, but a multi-instance deployment needs a shared store or edge/WAF limit to keep counters consistent.

Default window: `RATE_LIMIT_WINDOW_MS=60000`.

| Policy | Default | Main routes |
| --- | ---: | --- |
| `RATE_LIMIT_LOGIN_MAX` | 10 | password login, Google login start/callback |
| `RATE_LIMIT_UPLOAD_MAX` | 20 | public upload, sales documents, legacy documents, wiki attachments, CSV validation |
| `RATE_LIMIT_AI_MAX` | 10 | document AI analysis/apply, sales AI analysis, ranking snapshots |
| `RATE_LIMIT_SEARCH_MAX` | 120 | global search and lightweight polling/status reads |
| `RATE_LIMIT_INTERACTION_MAX` | 60 | FAQ comments/reactions, script copy/suggestions, notification reads, webhooks |
| `RATE_LIMIT_ADMIN_MAX` | 90 | admin diagnostics, org/user settings, announcements, wiki/admin mutations |

Exceeded limits return `429 TOO_MANY_REQUESTS` with `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers. Events are logged as `http.rate_limit_exceeded`.

## Production env gate

`node scripts/check-env.js --production` requires safe public URLs and rejects loopback or non-HTTPS values for `CORS_ORIGIN` and `VITE_API_BASE_URL`.
