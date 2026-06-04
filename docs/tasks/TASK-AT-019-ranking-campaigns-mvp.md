# TASK-AT-019 - Ranking and campaigns MVP

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-019-ranking-campaigns-mvp.md

## Objetivo
Exibir ranking comercial e campanhas iniciais com base em notas aprovadas.

## Entregue
- Endpoint `GET /v1/sales/campaigns`.
- Endpoint `GET /v1/sales/ranking`.
- Ranking calculado em tempo real por vendedor, total vendido, quantidade e notas.
- Filtros tecnicos por periodo, vendedor, grupo e campanha.
- Tela de Ranking usando endpoint dedicado.
- Tela de Ranking agora expoe filtros visuais por campanha, grupo e periodo.
- Tela de Campanhas read-only usando campanhas seedadas/cadastradas.
- CRUD MVP de campanhas para admin/gestor/supervisor.
- Tela de Campanhas permite criar, editar, ativar/pausar e gerar snapshot de ranking.
- Endpoint `POST /v1/sales/campaigns`.
- Endpoint `PATCH /v1/sales/campaigns/:campaignId`.
- Endpoint `POST /v1/sales/campaigns/:campaignId/snapshots`.
- Endpoint `GET /v1/sales/campaigns/snapshots`.
- Snapshots persistem payload congelado em `RankingSnapshot` com auditoria.

## Aceite
- Ranking considera apenas `SalesDocument` com status `APPROVED`.
- Escopo por role continua aplicado para vendedor e supervisor.
- Campanha pode limitar periodo/grupo no ranking.
- Supervisor só gerencia campanhas do proprio grupo supervisionado.
- Snapshot registra ranking calculado no momento da acao.

## Residual
- Falta filtro visual por vendedor no ranking.
- Falta tela analitica para comparar snapshots historicos.
