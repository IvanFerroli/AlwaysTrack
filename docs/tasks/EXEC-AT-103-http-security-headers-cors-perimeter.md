# EXEC-AT-103 - Seguranca: headers HTTP, CORS e perimetro web

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-103-http-security-headers-cors-perimeter.md

## Entrega
Endurecida a borda HTTP da API e da SPA com headers seguros, CORS estrito e validacao de ambiente de producao.

## Escopo coberto
1. Middleware `services/api/src/core/http/security.ts` com CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP e CORP.
2. CORS fail-closed para origens fora de `CORS_ORIGIN`, mantendo loopback em desenvolvimento.
3. `deploy/nginx.conf` atualizado com headers equivalentes para a SPA.
4. `scripts/check-env.js` valida URLs HTTPS publicas em producao.
5. Guia operacional em `docs/security/http-perimeter.md`.

## Validacao
- `npm run test --workspace @alwaystrack/api -- security.test.ts rate-limit.test.ts env.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run build --workspace @alwaystrack/web`

## Risco residual
- CSP/CORS precisam ser revisados com o dominio real antes de exposicao externa.
