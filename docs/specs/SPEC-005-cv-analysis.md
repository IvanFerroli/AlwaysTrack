# SPEC-005 - CV Analysis

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-005-cv-analysis.md

## Objetivo unico
Transformar CV textual (`doc/*.txt`) em Resume Profile reaproveitavel.

## Fronteira
- inclui: `GET /v1/main-cv/sources` e `POST /v1/main-cv/analyze`.
- nao inclui: parser PDF/Doc externo e enrichment LLM de vaga.

## Contrato observavel
- entrada: `MainCvAnalyzeInput`.
- saida: `ApiResult<MainCvAnalyzeResult>` com `source`, `extractedSkills`, `resumeProfile`.
- requer arquivo existente na pasta `doc/`.

## Limites
- baseline atual focado em arquivo texto.
- qualidade da extração depende do conteúdo do CV fonte.

## Observabilidade minima
- resultado de analise deve ser auditavel por criação de profile/memory no fluxo.
- erros de arquivo ausente/invalidade retornam código controlado.

## Acceptance Criteria
1. Lista de fontes de CV reflete arquivos disponíveis.
2. Analise cria profile com skills extraídas e extras opcionais.
3. Falhas de input retornam erro deterministico.

## Definition of Done
1. Fluxo main-cv -> resume profile funcional.
2. Cobertura de testes para listagem/análise.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/resume-profiles/resume-profiles.service.test.ts`
- revisao manual:
  - executar analyze com arquivo válido e conferir profile criado.

## Evidencia esperada
- resposta com `extractedSkills` e `resumeProfile.id`.
- endpoint de listagem mostrando fontes reais.

## Riscos e mitigacao
- risco: baixa qualidade do texto fonte prejudicar skills.
- mitigacao: permitir `extraSkills` e ajuste posterior de profile.
