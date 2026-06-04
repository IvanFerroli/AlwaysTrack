# TASK-AT-023 - Frankenstein UI cleanup

## Metadata
- status: completed-mvp
- owner: product-builder
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-023-frankenstein-ui-cleanup.md

## Objetivo
Remover o dominio SyLembra da navegacao ativa.

## Entregue
- Navegacao ativa: Dashboard, Notas, Ranking, Campanhas, Extratos, Wiki, Usuarios/Times e Auditoria.
- Profissionais, Licencas, Documentos antigos e Relatorios antigos saem da rota feliz da UI.
- Brand passa a comunicar notas, ranking e campanhas.
- Login e manifesto PWA comunicam operacao comercial, sem promessa de licencas/compliance.
- Rotas autenticadas do dominio antigo ficam opt-in via `ENABLE_LEGACY_SYLEMBRA=true`.

## Residuos
- Componentes legados ainda existem no bundle para transicao tecnica e ficam sem navegacao ativa.
- Help antigo fica fora da navegacao ativa, mas ainda precisa ser reescrito/removido em fase posterior.
- Mapa de descontinuacao em fases registrado em `docs/tasks/TASK-AT-027-decommission-sylembra-legacy.md`.
