# SPEC-006 - Job Matching

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-006-job-matching.md

## Objetivo unico
Rankear vagas por afinidade com profile de forma explicavel e filtravel.

## Fronteira
- inclui: `POST /v1/match/score` e `GET /v1/jobs/ranked`.
- nao inclui: deep score LLM e proposta de aplicacao.

## Contrato observavel
- entrada: `MatchScoreInput` e filtros de ranking (`q`, `minScore`, `status`, `tags`, `location`, `sourceName`, `seniority`, `sortByDate`, paginacao).
- saida: `MatchScoreResult` e `ListPayload<RankedJobPosting>`.
- regras:
  - aliases tecnicos e penalidade controlada por senioridade.
  - `scoreBreakdown` opcional sob flag.

## Limites
- ranking depende da qualidade de tokens/perfil base.
- sem garantia de qualidade sem profile válido.

## Observabilidade minima
- score e rationale retornados por endpoint.
- filtros inválidos retornam `INVALID_JOB_FILTERS`.

## Acceptance Criteria
1. Ranking responde com score/matchedSkills por vaga.
2. Filtros multi-select e paginação funcionam sem erro.
3. Penalidade de senioridade e aliases seguem comportamento testado.

## Definition of Done
1. Ranking local explicavel e estável no contrato atual.
2. Testes cobrem filtros, aliases, senioridade e breakdown.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts`
- revisao manual:
  - chamar `/v1/jobs/ranked` com filtros inválidos e válidos.

## Evidencia esperada
- lista ranqueada com scores.
- retorno 400 para filtros inválidos.

## Riscos e mitigacao
- risco: regressao de score por mudança de pesos.
- mitigacao: manter testes de calibracao e breakdown.
