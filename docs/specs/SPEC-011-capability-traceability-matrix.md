# SPEC-011 - Capability Traceability Matrix

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-011-capability-traceability-matrix.md

## Objetivo unico
Manter rastreabilidade explícita entre capability ativa, contrato runtime, tipos e testes.

## Matriz capability -> runtime -> contrato -> teste
| Capability | Endpoints principais | Tipos principais | Testes-base |
| --- | --- | --- | --- |
| job-ingestion | `GET /v1/job-postings`, `POST /v1/job-postings/ingest`, `POST /v1/jobs/update` | `IngestJobPostingInput`, `IngestJobPostingResult`, `JobPosting` | `src/features/ingestion/ingestion.service.test.ts` |
| job-acquisition | `POST /v1/jobs/acquire` | `JobAcquisitionInput`, `JobAcquisitionResult`, `JobAcquisitionEvidence` | `src/features/acquisition/acquisition.service.test.ts` |
| job-scraping | `POST /v1/scraper/run` | `ScraperRunResult`, `SourceRunResult` (feature types) | `src/features/scraper/scraper.runner.test.ts` |
| resume-profile-management | `GET/POST /v1/resume-profiles`, `POST /v1/resume-profiles/update`, `GET /v1/resume-profiles/get` | `ResumeProfile`, `ResumeProfileCreateInput` | `src/features/resume-profiles/resume-profiles.service.test.ts` |
| cv-analysis | `GET /v1/main-cv/sources`, `POST /v1/main-cv/analyze` | `MainCvSource`, `MainCvAnalyzeInput`, `MainCvAnalyzeResult` | `src/features/resume-profiles/resume-profiles.service.test.ts` |
| job-matching | `POST /v1/match/score`, `GET /v1/jobs/ranked` | `MatchScoreInput`, `MatchScoreResult`, `RankedJobPosting` | `src/features/match/match.service.test.ts` |
| deep-score-ai | `POST /v1/match/deep-score` | `MatchScoreInput`, `MatchScoreResult` | `src/core/llm/gemini.test.ts` |
| strategy-approval-gate | `POST /v1/strategy/propose`, `GET/POST /v1/approval-queue/*` | `StrategyProposalInput`, `StrategyProposalResult`, `ApprovalRequest` | `src/features/strategy/strategy.service.test.ts`, `src/features/execution/execution.service.test.ts` |
| application-tracking | `GET /v1/applications`, `POST /v1/applications/update-status` | `ApplicationRecord`, `UpdateApplicationStatusInput` | `src/features/execution/execution.service.test.ts` |
| runtime-observability | `GET /v1/metrics`, `GET /v1/agent-runs`, `GET /v1/decision-logs`, `GET /v1/skill-executions`, `GET /v1/memory-entries` | `MetricsSnapshot`, `AgentRun`, `DecisionLog`, `SkillExecution`, `MemoryEntry` | `src/features/observability/observability.service.test.ts`, `src/features/pipeline/pipeline.service.test.ts` |

## Criterio de evolucao de spec
- task **deve** alterar spec quando mudar:
  - contrato de endpoint (entrada, saída, código de erro);
  - comportamento de dedupe/ranking/approval/métricas observáveis;
  - limites operacionais declarados (budget, timeout, volume, fallback).
- task **não precisa** alterar spec quando mudar:
  - refactor interno sem mudança observável de contrato;
  - limpeza de código/comentário/organização sem impacto funcional;
  - ajuste de teste que apenas confirma comportamento já documentado.

## Gap critico atual (ideal vs implementado)
- deep-score-ai e scraping dependem de disponibilidade externa (API key/proteções anti-bot), reduzindo previsibilidade operacional mesmo com fallback/falha controlada.
