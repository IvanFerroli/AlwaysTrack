# TASK-MCH-002 - Afinidade v2 com ponderação e calibração

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-MCH-002-afinidade-v2-ponderacao-e-calibracao.md

## Modo
- mode: runtime

## Objetivo unico
Evoluir o score de afinidade para reduzir falsos baixos/altos com ponderação explícita de sinais (skills centrais, senioridade, keyword e título).

## Contexto minimo
Uso real mostrou casos de baixa afinidade em vagas claramente aderentes. O algoritmo atual já usa aliases e boosts, mas ainda precisa de calibração orientada a evidência.

## Inputs
- `services/api/src/domain/matching/scoring.ts`
- `services/api/src/domain/matching/seniority.ts`
- `services/api/src/features/match/match.service.ts`
- `services/api/src/features/match/match.service.test.ts`

## Dependencias
- satisfeitas: TASK-MCH-001, TASK-SCR-008
- em aberto: baseline de conjunto ouro para calibração contínua

## Alvos explicitos
1. Introduzir composição de score com pesos explícitos (skills fortes, skills fracas, title hit, keyword hit, seniority alignment).
2. Tratar mismatch de senioridade como penalidade controlada (sem zerar score indevidamente).
3. Expor `scoreBreakdown` opcional no retorno ranqueado para debug operacional.
4. Criar suíte de testes com casos reais curados (junior/pleno/senior, node/react/typescript).

## Fora de escopo
- uso obrigatório de LLM para todo cálculo;
- alteração de contratos externos além do necessário;
- personalização por usuário nesta task.

## Checklist
1. Refatorar cálculo para função determinística testável.
2. Adicionar `scoreBreakdown` atrás de flag/param de debug.
3. Cobrir regressões principais em teste unitário.
4. Validar ranking em cenário real de amostra.

## Acceptance Criteria
1. Casos aderentes `node+react` não ficam subavaliados sem justificativa.
2. Casos de mismatch grosseiro caem no ranking de forma previsível.
3. `scoreBreakdown` mostra pesos aplicados quando solicitado.

## Definition of Done
1. Score mais estável e explicável por evidência.
2. Testes de calibração passam e documentam trade-offs.

## Validacao
- comandos/checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts`
- revisao manual:
  - comparar top 10 antes/depois com mesma base de vagas.

## Evidencia esperada
- diff de ranking em amostra fixa;
- print/log de `scoreBreakdown` em 3 casos representativos.

## Riscos
- overfitting em poucos exemplos;
- complexidade excessiva do score sem ganho real.

## Blockers possiveis
- ausência de dataset de validação mínimo;
- variação de qualidade dos textos de vaga.

## Feedback obrigatorio de retorno
- quais pesos finais foram adotados e por quê?
- em quais casos o ranking melhorou de forma clara?
