# EXEC-AT-068 - Central Operacional Hoje

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- source-task: `TASK-AT-069-operational-today-center.md`

## Resumo
Entrega MVP da Central Operacional "Hoje" no dashboard, com agregado backend proprio e cards acionaveis para notas, ranking, campanhas, Wiki e FAQ.

## Implementacao
1. Criado endpoint autenticado `GET /v1/operations/today` para roles comerciais.
2. Criado servico `getOperationalToday` com metricas do dia, filas curtas e alertas operacionais.
3. Adicionada UI de Central Operacional antes dos indicadores antigos do dashboard.
4. Conectados cards a navegacao real com filtros iniciais em Notas, Ranking e FAQ.
5. Adicionado contrato frontend `OperationalTodayData`.
6. Coberto o agregado backend com teste unitario de admin e escopo de vendedor.

## Arquivos principais
- `services/api/src/core/operations/operations.service.ts`
- `services/api/src/core/operations/operations.handlers.ts`
- `services/api/src/core/operations/operations.service.test.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/dashboard.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/sales.ts`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- operations.service.test.ts`

## Riscos e proximos passos
- A Central usa agregados em tempo real com limites pequenos; volume alto deve ser acompanhado por `TASK-AT-081`.
- A navegacao aplica filtros iniciais, mas filtros mais sofisticados dependem da paginacao server-side de `TASK-AT-076`.
- O ranking parcial fica mais convincente depois do ranking explicavel de `TASK-AT-070`.

