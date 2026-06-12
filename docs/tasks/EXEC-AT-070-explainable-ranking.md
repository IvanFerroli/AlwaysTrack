# EXEC-AT-070 - Ranking explicavel

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- source-task: `TASK-AT-070-explainable-ranking.md`

## Resumo
Criada composicao auditavel por vendedor no ranking, permitindo abrir a prova da posicao com notas aprovadas, totais, ticket medio, pendencias, rejeicoes, duplicidades e snapshot mais recente quando houver campanha.

## Implementacao
1. Adicionado endpoint `GET /v1/sales/ranking/:sellerProfileId/explanation`.
2. Criado servico `getSalesRankingExplanation`, reaproveitando `getSalesRanking` e os mesmos filtros/escopos de periodo.
3. Incluidas notas aprovadas que entraram no calculo e documentos relacionados que nao pontuam.
4. Exposto snapshot mais recente da campanha quando aplicavel.
5. Adicionado botao "Explicar" em cada linha do ranking e painel visual de composicao.
6. Adicionado teste unitario cobrindo soma, quantidade, ticket medio e excecoes relacionadas.

## Arquivos principais
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `services/api/src/core/sales-documents/sales-documents.service.test.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/ranking.tsx`
- `apps/web/src/sales.ts`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run build --workspace @alwaystrack/web`

## Riscos e proximos passos
- Pendencias e rejeicoes relacionadas usam periodo de envio; notas aprovadas usam periodo de emissao, como o ranking.
- Links profundos para abrir Notas/Extratos com filtro aplicado podem ser refinados junto com `TASK-AT-071` e `TASK-AT-076`.
- A prova por nota fica ainda mais forte quando a timeline visual da nota estiver entregue.

