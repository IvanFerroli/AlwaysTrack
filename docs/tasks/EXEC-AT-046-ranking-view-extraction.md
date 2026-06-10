# EXEC-AT-046 - Ranking view extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-10
- tasks: TASK-AT-054

## Entrega
- `RankingView` extraida de `apps/web/src/main.tsx` para `apps/web/src/views/ranking.tsx`.
- Helpers compartilhados de vendas centralizados em `apps/web/src/sales.ts`:
  - `formatMoneyFromCents`;
  - `salesFilterQuery`;
  - `withoutSellerFilter`;
  - `mergeUniqueGroups`;
  - `SalesFilters`.
- `main.tsx` continua usando os helpers centralizados para Notas/Extratos e importa Ranking como view de dominio.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- Notas e Extratos ainda estao no `main.tsx` e sao os proximos candidatos naturais de extracao.
