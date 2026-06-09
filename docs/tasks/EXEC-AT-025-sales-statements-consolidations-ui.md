# EXEC-AT-025 - Sales statements consolidations UI

## Metadata
- task-id: AT-021B
- execution-id: EXEC-AT-025
- mode: runtime
- execution-mode: batch-worker
- specialist: codex
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Revisado o residual deixado por `EXEC-AT-023` para consumo de `consolidations` na UI de extratos.
2. Adicionado contrato TypeScript para consolidados por vendedor e por grupo em `SalesStatementData`.
3. Inserido painel compacto na `StatementsView` reutilizando `panel`, `table-panel`, `table-panel-toolbar`, `dashboard-grid` e `OperationalTable`.
4. Mantidos filtros, link CSV, chamadas existentes e estados de carregamento/vazio sem novo endpoint.

## Artefatos materiais
1. `apps/web/src/main.tsx`
2. `docs/tasks/EXEC-AT-025-sales-statements-consolidations-ui.md`

## Evidências observáveis
1. `GET /v1/sales/statements` passa a alimentar duas tabelas consolidadas: por vendedor e por grupo.
2. As tabelas exibem documentos, itens/quantidade e total monetario formatado em reais.
3. A lista detalhada de notas aprovadas e o link CSV permanecem no mesmo fluxo da tela.
4. `npm run typecheck --workspace @alwaystrack/web` - passou.
5. `npm run build --workspace @alwaystrack/web` - passou.

## Blockers
Nenhum.

## Nota para próximo ciclo
Validar visualmente em ambiente com dados comerciais aprovados para conferir densidade das tabelas em telas estreitas.
