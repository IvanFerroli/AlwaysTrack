# TASK-AT-021 - Sales statements MVP

## Metadata
- status: completed-partial
- owner: runtime-builder
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-021-sales-statements-mvp.md

## Objetivo
Permitir extratos comerciais gerais, por vendedor ou por grupo a partir das notas aprovadas.

## Entregue
- Endpoint `GET /v1/sales/statements`.
- Endpoint `GET /v1/sales/statements.csv`.
- Filtros tecnicos por periodo, vendedor e grupo.
- Filtros visuais por campanha, grupo, vendedor e periodo na tela de Extratos.
- Link de CSV passa a preservar os filtros aplicados.
- Resumo com quantidade de notas, valor total e itens.
- Tela de Extratos com lista de notas aprovadas e link CSV.

## Aceite
- Extrato considera apenas notas aprovadas.
- Vendedor enxerga apenas o proprio escopo.
- Supervisor enxerga escopo do seu grupo.
- Admin/gestor/SAC/financeiro enxergam escopo amplo da organizacao.

## Residual
- CSV ainda e simples e focado em itens aprovados.
- Falta consolidado visual agrupado por vendedor/grupo no proprio painel.
