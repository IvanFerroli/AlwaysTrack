# EXEC-AT-106 - Seguranca: rate limit e protecao contra abuso

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-106-rate-limit-and-abuse-protection.md

## Entrega
Criado limitador reutilizavel para login, uploads, IA, busca, interacoes e rotas administrativas sensiveis.

## Escopo coberto
1. Middleware em `services/api/src/core/http/rate-limit.ts`.
2. Politicas por rota aplicadas em `services/api/src/app.ts`.
3. Resposta `429 TOO_MANY_REQUESTS` com `Retry-After` e headers `RateLimit-*`.
4. Limites configuraveis por `RATE_LIMIT_*`.
5. Logs estruturados para limite excedido.

## Validacao
- `npm run test --workspace @alwaystrack/api -- rate-limit.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`

## Risco residual
- Store em memoria e adequada para MVP/local single-instance; deploy multi-instancia deve usar borda compartilhada, Redis ou WAF.
