# TASK-SCR-006 - Execution Report

## Metadata
- task-id: TASK-SCR-006
- execution-id: EXEC-SCR-006
- specialist: olympus-runtime-builder
- execution-mode: execution artifact mode
- date: 2026-04-26
- status: completed-with-remarks

## Escopo executado
1. Fontes de plataforma `linkedin` e `gupy` foram incorporadas ao runner multi-source.
2. `source=all` passou a incluir fontes operacionais de plataforma.
3. A origem da vaga foi preservada em `sourceName` para rastreabilidade no ranking e no dashboard.

## Evidências
- Alterações em `services/api/src/features/scraper/scraper.runner.ts`.
- Persistência no Postgres via pipeline de ingestão existente.
- Exposição operacional no dashboard para execução por fonte.

## Ressalvas
- `indeed`, `glassdoor` e `cryptojobslist` permanecem nomeadas, mas indisponíveis no runner automático atual por limitação de endpoint/feed.

