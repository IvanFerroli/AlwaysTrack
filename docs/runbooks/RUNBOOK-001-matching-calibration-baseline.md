# RUNBOOK-001 - Matching Calibration Baseline

## Metadata
- status: active
- owner: olympus-quality-builder
- last-updated: 2026-04-26
- source-of-truth: docs/runbooks/RUNBOOK-001-matching-calibration-baseline.md

## Objetivo
Tornar reproduzível a calibração de ranking/matching usando dataset curado versionado e thresholds objetivos.

## Gatilhos
- alteração em pesos/regras de score (`scoring.ts`);
- mudança de ordenação/filtros de ranking (`match.service.ts`);
- atualização de dataset curado de calibração.

## Pre-condicoes
- dependências instaladas;
- ambiente apto para rodar testes da API.

## Passos operacionais
1. Revisar o dataset curado atual em `services/api/src/features/match/fixtures/curated-ranking.dataset.ts`.
2. Rodar baseline de regressão:
   - `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts`
3. Validar no teste `match service ranking regression guard with curated dataset baseline`:
   - `precision@k` por cenário acima do threshold;
   - cobertura de skills críticas acima do threshold;
   - faixas de score por vaga âncora dentro do esperado.
4. Se houver ajuste de pesos, atualizar dataset/thresholds apenas com justificativa e evidência comparativa no report da task.

## Validacao
- sinais esperados:
  - teste de regressão do dataset passa;
  - sem regressão nos demais testes de match.
- checks/comandos:
  - `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts`
  - `npm run check`

## Evidencia
- saída dos comandos acima;
- diff do dataset (`curated-ranking.dataset.ts`) quando houver mudança;
- report da task com métrica principal (`precision@k`) e impacto em top-k.

## Rollback/contingencia
1. Reverter alteração de pesos/ordenação que quebrou threshold sem ganho claro.
2. Se mudança for legítima, atualizar expectativas do dataset em nova task de calibração com justificativa explícita.

## Escalonamento
- owner primario: olympus-quality-builder
- owner secundario: olympus-runtime-builder
