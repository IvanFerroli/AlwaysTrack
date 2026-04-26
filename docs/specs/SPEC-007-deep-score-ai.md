# SPEC-007 - Deep Score AI

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-007-deep-score-ai.md

## Objetivo unico
Disponibilizar score aprofundado por LLM para leitura qualitativa de fit.

## Fronteira
- inclui: `POST /v1/match/deep-score`.
- nao inclui: decisão automática de candidatura sem gate humano.

## Contrato observavel
- entrada: `MatchScoreInput`.
- saida: `ApiResult<MatchScoreResult>` com rationale de analise profunda.
- pre-condicao: `GEMINI_API_KEY` configurada.

## Limites
- sem chave API, endpoint retorna `MISSING_API_KEY`.
- custo/latencia dependem de provedor externo.

## Observabilidade minima
- logs de `agent-runs`, `decision-logs` e `skill-executions` para deep score.
- rastro de falha quando chave ou chamada externa falham.

## Acceptance Criteria
1. Com chave válida, endpoint retorna score/rationale.
2. Sem chave, erro controlado e explícito.
3. Fluxo não quebra endpoints de score local.

## Definition of Done
1. Deep score permanece opcional e isolado.
2. Testes cobrem fallback/erro de integração LLM.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/core/llm/gemini.test.ts`
- revisao manual:
  - chamar endpoint com e sem `GEMINI_API_KEY`.

## Evidencia esperada
- resposta com rationale profunda quando habilitado.
- erro `MISSING_API_KEY` sem chave.

## Riscos e mitigacao
- risco: variação de custo/latencia por provedor.
- mitigacao: manter feature opcional com falha controlada.
