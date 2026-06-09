# EXEC-AT-023 - Sales statement consolidations

## Metadata
- task-id: AT-021B
- execution-id: EXEC-AT-023
- mode: runtime
- execution-mode: batch-worker
- orchestrator: olympus_orchestrator
- specialist: worker
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Revisado o residual de `TASK-AT-021` sobre consolidado visual por vendedor/grupo.
2. Adicionado contrato backend aditivo em `GET /v1/sales/statements`.
3. Agrupados documentos aprovados por vendedor e por grupo usando a mesma query, filtros e escopo por papel ja existentes.
4. Mantido CSV sem alteracao.
5. Adicionados testes focados para agrupamento e escopo de vendedor.

## Artefatos materiais
1. `services/api/src/core/sales-documents/sales-documents.service.ts`
2. `services/api/src/core/sales-documents/sales-documents.service.test.ts`
3. `docs/tasks/EXEC-AT-023-sales-statements-consolidations.md`

## Evidências observáveis
1. `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts` - passou; 16 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `GET /v1/sales/statements` agora retorna `consolidations.bySeller` e `consolidations.byGroup` com documentos, quantidade e total em centavos.

## Blockers
Nenhum.

## Nota para próximo ciclo
UI ainda precisa consumir `consolidations`. Totais consolidados seguem os itens comerciais aprovados, como ranking/dashboard; `summary.totalAmountCents` continua preservando o comportamento atual de usar o total da nota quando disponivel.
