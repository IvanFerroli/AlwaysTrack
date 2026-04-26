# TASK-MCH-004 - Calibracao de matching com dataset curado

## Metadata
- status: closed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-MCH-004-calibracao-com-dataset-curado.md

## Modo
- mode: quality

## Objetivo unico
Estabelecer baseline de calibracao do matching com dataset curado de vagas/perfis para reduzir regressao silenciosa de score e ranking.

## Contexto minimo
A memoria registra dependencia aberta de calibracao com dataset real. Hoje a evolucao do score depende de testes pontuais e heuristica.

## Inputs
- `services/api/src/features/match/match.service.ts`
- `services/api/src/domain/matching/scoring.ts`
- `services/api/src/features/match/match.service.test.ts`
- `packages/shared-types/src/index.ts`

## Dependencias
- satisfeitas: TASK-MCH-002, TASK-MCH-003, TASK-PRD-008
- em aberto: curadoria inicial do dataset e criterio de verdade-terreno

## Alvos explicitos
1. Criar dataset curado minimo versionado (perfis + vagas + expectativa de ordenacao/faixa de score).
2. Implementar teste de regressao de ranking baseado no dataset.
3. Definir metricas de qualidade de ranking (ex.: precision@k simplificada, cobertura de skills criticas).
4. Registrar regra de ajuste de pesos com impacto mensuravel.

## Fora de escopo
- treinamento de modelo novo;
- avaliacao estatistica avancada em larga escala;
- coleta automatica de dataset externo.

## Checklist
1. Definir formato de dataset e fixtures em repositorio.
2. Criar testes deterministas para ranking e score breakdown.
3. Introduzir thresholds minimos de qualidade para impedir regressao.
4. Documentar processo de recalibracao com evidencias obrigatorias.

## Acceptance Criteria
1. Existe teste automatizado que falha em regressao relevante de ranking.
2. Ajuste de pesos passa a exigir comparativo antes/depois sobre dataset.
3. Processo de calibracao fica reproduzivel por outras IAs.

## Definition of Done
1. Baseline de calibracao materializado e versionado.
2. Pipeline de quality passa a ter sinal objetivo de qualidade de matching.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts`
  - `npm run check`
- revisao manual:
  - comparar ordenacao esperada vs obtida em pelo menos 3 cenarios curados.

## Evidencia esperada
- fixture/dataset versionado;
- teste de regressao de ranking;
- nota de calibracao com deltas de qualidade.

## Riscos
- dataset enviesado para poucos perfis;
- threshold mal calibrado travar evolucao legitima.

## Blockers possiveis
- falta de exemplos de verdade-terreno confiavel;
- divergencia de criterio entre score tecnico e utilidade humana.

## Feedback obrigatorio de retorno
- qual metrica foi adotada como baseline principal?
- houve ganho observavel de estabilidade no top-k apos calibracao?
