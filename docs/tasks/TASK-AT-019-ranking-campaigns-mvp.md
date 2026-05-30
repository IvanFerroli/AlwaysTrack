# TASK-AT-019 - Ranking and campaigns MVP

## Metadata
- status: completed-partial
- owner: runtime-builder
- last-updated: 2026-05-30
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

## Aceite
- Ranking considera apenas `SalesDocument` com status `APPROVED`.
- Escopo por role continua aplicado para vendedor e supervisor.
- Campanha pode limitar periodo/grupo no ranking.

## Residual
- Falta CRUD de campanhas.
- Falta snapshot historico em `RankingSnapshot`.
- Falta filtro visual por vendedor no ranking.
