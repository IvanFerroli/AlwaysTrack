# TASK-MCH-004 - Execution Report

## Metadata
- task-id: TASK-MCH-004
- execution-id: EXEC-MCH-004
- specialist: olympus-quality-builder
- support-specialist: olympus-runtime-builder
- execution-mode: execution artifact mode
- orchestrator: olympus-orchestrator
- date: 2026-04-26
- status: completed-with-remarks

## Escopo executado
1. Criado dataset curado versionado para calibração de matching:
   - `services/api/src/features/match/fixtures/curated-ranking.dataset.ts`
2. Implementado teste de regressão de ranking baseado no dataset:
   - cenário multi-profile com thresholds de `precision@k`, cobertura de skills críticas e faixas de score.
3. Introduzido sinal objetivo de qualidade no pipeline de testes:
   - teste `match service ranking regression guard with curated dataset baseline` em `match.service.test.ts`.
4. Documentado processo de recalibração reproduzível:
   - `docs/runbooks/RUNBOOK-001-matching-calibration-baseline.md`.

## Métrica baseline adotada
- métrica principal: **`precision@k` por cenário curado**.
- métrica complementar: **cobertura de skills críticas no top-k**.

## Evidencia de estabilidade observada
- 3 cenários curados passaram com thresholds mínimos configurados.
- sinal de regressão agora é determinístico: mudança relevante de ranking quebra teste automaticamente.

## Artefatos materiais
- `services/api/src/features/match/fixtures/curated-ranking.dataset.ts`
- `services/api/src/features/match/match.service.test.ts`
- `docs/runbooks/RUNBOOK-001-matching-calibration-baseline.md`

## Evidencias de gate
- `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts` passou.
- `npm run check` passou.

## Ressalvas
- dataset ainda é mínimo (3 cenários) e precisa evolução contínua para reduzir viés por domínio.
