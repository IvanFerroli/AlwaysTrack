# TASK-MCH-002 - Execution Report

## Metadata
- task-id: TASK-MCH-002
- execution-id: EXEC-MCH-002
- specialist: olympus-runtime-builder
- support-specialist: olympus-quality-builder
- execution-mode: execution artifact mode
- orchestrator: olympus-orchestrator
- date: 2026-04-26
- status: completed-with-remarks

## Escopo executado
1. Score de afinidade evoluído para composição ponderada explícita (`strongSkills`, `weakSkills`, `titleHit`, `keywordHit`, `seniorityAlignment`).
2. Mismatch de senioridade tratado por penalidade controlada (`seniorityMismatch`) sem zerar score indevidamente.
3. `scoreBreakdown` exposto de forma opcional no ranking (`includeScoreBreakdown=true`).
4. Cobertura de regressão adicionada para mismatch de senioridade e breakdown opcional.

## Artefatos materiais
- `services/api/src/domain/matching/scoring.ts`
- `services/api/src/domain/matching/seniority.ts`
- `services/api/src/features/match/match.service.ts`
- `services/api/src/features/match/match.handlers.ts`
- `services/api/src/features/match/match.service.test.ts`
- `packages/shared-types/src/index.ts`

## Pesos adotados e justificativa
- `strongSkills`: `45`
- `weakSkills`: `20`
- `titleHit`: `15`
- `keywordHit`: `10`
- `seniorityAlignment`: `10`

Justificativa: priorizar aderência técnica real (skills fortes/fracas = 65%), preservar explicabilidade por sinais de contexto (title/keyword = 25%) e manter senioridade como ajuste de risco (10% + penalidade controlada para mismatch alto).

## Evidencias de gate
- `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts` passou.
- `npm run test --workspace @olympus/api -- src/features/strategy/strategy.service.test.ts` passou.
- `npm run lint` passou.
- `npm run typecheck` passou.

## Evidencia de calibração (amostra fixa)
### Diff Top 10 (legado vs atual)
```json
{
  "legacyTop10": [
    { "title": "Principal Node React Architect", "score": 100 },
    { "title": "Junior Node React Developer", "score": 100 },
    { "title": "Backend Engineer", "score": 40 }
  ],
  "currentTop10": [
    { "title": "Junior Node React Developer", "score": 100 },
    { "title": "Principal Node React Architect", "score": 76 },
    { "title": "Backend Engineer", "score": 43 }
  ]
}
```

### `scoreBreakdown` em 3 casos representativos
- Caso aderente (`Junior Node React Developer`): score `100`, sem penalidade de senioridade.
- Caso mismatch forte (`Principal Node React Architect`): score `76`, `seniorityMismatch=14`.
- Caso aderência parcial (`Backend Engineer`): score `43`, match parcial de skills e keyword.

## Melhorias observáveis de ranking
- Vaga aderente junior subiu para o topo quando comparada com vaga lead com mesmo stack.
- Mismatch grosseiro de senioridade deixou de empatar no topo com vagas aderentes do nível esperado.
- Relevância por keyword passou a entrar no score final de forma rastreável.

## Ressalvas
- Calibração atual é determinística e explicável, mas ainda sem dataset ouro contínuo.
- Ajustes finos de pesos podem ser revisitados após coleta de mais casos reais.
