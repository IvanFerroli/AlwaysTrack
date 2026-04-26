# SPEC-001 - Job Ingestion

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-001-job-ingestion.md

## Objetivo unico
Garantir ingestao idempotente de vagas com normalizacao minima e deduplicacao observavel.

## Fronteira
- inclui: `POST /v1/job-postings/ingest`, `GET /v1/job-postings`, `POST /v1/jobs/update`.
- nao inclui: scraping, acquisition, ranking e strategy.

## Contrato observavel
- entrada: `IngestJobPostingInput`.
- saida: `ApiResult<IngestJobPostingResult>` e `ListPayload<JobPosting>`.
- regras:
  - dedupe por `dedupeKey`.
  - `recordIngestionAttempt` sempre incrementa tentativa.
  - payload invalido retorna `INVALID_INGEST_PAYLOAD`.

## Limites
- sem garantia de ordenacao custom fora do baseline atual de listagem.
- update de tags/status respeita validacao de tags seguras.

## Observabilidade minima
- `agent-runs`, `decision-logs`, `skill-executions` por ingest.
- `GET /v1/metrics`: `ingestionAttempts`, `dedupeHits`, `dedupeRate`.

## Acceptance Criteria
1. Ingest repetida para mesma vaga reaproveita registro existente.
2. Ingest valida cria vaga com tokens normalizados.
3. Metricas de ingestao ficam coerentes com tentativas/dedupe.

## Definition of Done
1. Endpoints de ingest/list/update respondem conforme contrato.
2. Evidencia de dedupe e metricas disponivel via auditoria/metrics.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/ingestion/ingestion.service.test.ts`
- revisao manual:
  - repetir ingest da mesma vaga e confirmar `deduplicated=true`.

## Evidencia esperada
- resposta de ingest com `deduplicated`.
- snapshot de `/v1/metrics` com contadores atualizados.

## Riscos e mitigacao
- risco: falsa deduplicacao por chave mal formada.
- mitigacao: manter normalizacao de payload e testes de dedupe.
