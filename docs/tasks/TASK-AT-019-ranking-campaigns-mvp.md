# TASK-AT-019 - Ranking and campaigns MVP

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-06-04
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
- Tela de Ranking agora expoe filtro visual por vendedor para perfis com escopo amplo.
- Tela de Campanhas read-only usando campanhas seedadas/cadastradas.
- CRUD MVP de campanhas para admin/gestor/supervisor.
- Tela de Campanhas permite criar, editar, ativar/pausar e gerar snapshot de ranking.
- Tela de Campanhas exibe comparativo leve entre snapshots recentes.
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
- Opcoes do filtro de vendedor ainda dependem do ranking retornado pelos filtros atuais; falta endpoint dedicado de vendedores para popular o seletor de forma independente.
- Comparacao de snapshots ainda e leve, limitada aos snapshots recentes retornados pela API, e sem teste visual automatizado.
