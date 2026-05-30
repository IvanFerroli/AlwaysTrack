# TASK-AT-015 - Commercial domain model

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-015-commercial-domain-model.md

## Objetivo
Criar o modelo inicial de vendedores, grupos, notas, itens, campanhas e ranking.

## Entregue
- Prisma models: `SellerProfile`, `SalesGroup`, `SalesDocument`, `SalesDocumentExtraction`, `SalesItem`, `SalesCampaign`, `RankingSnapshot`.
- Migration `20260529211000_sales_operations_pivot`.
- Seed comercial com SAC, financeiro, vendedor, supervisor, grupo, nota aprovada, itens e campanha.

## Aceite
- Banco suporta DANFE vinculada a vendedor.
- Itens aprovados podem alimentar ranking e dashboard.
- Legado permanece apenas para transicao.
