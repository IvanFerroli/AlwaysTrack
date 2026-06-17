# EXEC-AT-105 - Seguranca: protecao CSRF e validacao de origem

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-105-csrf-origin-protection-for-cookie-api.md

## Entrega
Adicionado guard de origem para reduzir risco de CSRF em rotas mutantes autenticadas por cookie.

## Escopo coberto
1. `createOriginGuard` valida `Origin`/`Referer` para `POST`, `PATCH`, `PUT` e `DELETE`.
2. Em producao, mutacoes sem origem confiavel retornam `403`.
3. Desenvolvimento preserva chamadas locais por scripts, curl e Playwright.
4. Excecoes publicas foram limitadas a webhooks e uploads publicos previstos.
5. Testes cobrem origem valida, invalida, ausente e rotas excepcionadas.

## Validacao
- `npm run test --workspace @alwaystrack/api -- security.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`

## Risco residual
- Proxies de producao precisam preservar `Origin` ou `Referer` para rotas mutantes.
