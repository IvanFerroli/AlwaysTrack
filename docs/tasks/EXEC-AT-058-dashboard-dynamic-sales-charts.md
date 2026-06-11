# EXEC-AT-058 - Dashboard dynamic sales charts

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-060

## Objetivo
Adicionar grafico dinamico no dashboard comercial usando vendas aprovadas e filtros operacionais.

## Entregas
- Serie temporal em `getSalesDashboard`, com filtros por data, vendedor e grupo.
- Bucket automatico por tamanho do range: dia, semana ou mes.
- Contrato `SalesDashboardData.chart` no frontend.
- Filtros visuais no dashboard.
- Grafico SVG responsivo e tabela da serie.
- Teste de agregacao por periodo/filtro.

## Validacao
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts dashboard.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Residual
`TASK-AT-061` segue como proxima prioridade para tags e busca combinada em Wiki/FAQ.
