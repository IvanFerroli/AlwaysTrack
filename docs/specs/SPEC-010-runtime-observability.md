# SPEC-010 - Runtime Observability

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-010-runtime-observability.md

## Objetivo unico
Oferecer visibilidade operacional confiável do runtime e ciclos agentes.

## Fronteira
- inclui: `GET /v1/metrics`, `GET /v1/agent-runs`, `GET /v1/decision-logs`, `GET /v1/skill-executions`, `GET /v1/memory-entries`.
- nao inclui: BI externo e dashboards analíticos avançados.

## Contrato observavel
- entrada: leitura sem payload complexo.
- saida: snapshots/listagens auditáveis.
- métricas críticas persistidas: `ingestionAttempts`, `dedupeHits`, `strategyProposals`.

## Limites
- granularidade analítica é operacional, não financeira/BI.
- histórico depende de retenção do banco local.

## Observabilidade minima
- `/v1/metrics` não zera contadores críticos após restart da API.
- runs/decisions/skills documentam execução por capability.

## Acceptance Criteria
1. Métricas críticas sobrevivem a restart do processo API.
2. Endpoints de auditoria retornam trilha por execução.
3. Dedupe rate e pending approvals permanecem coerentes com estado.

## Definition of Done
1. Contrato de observabilidade estável e consumível por pipeline.
2. Testes de observabilidade validam persistência de contadores.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/observability/observability.service.test.ts`
- revisao manual:
  - executar ingest/strategy, reiniciar API e comparar `/v1/metrics`.

## Evidencia esperada
- contadores persistidos em `runtime_metrics`.
- listagens de audit logs disponíveis.

## Riscos e mitigacao
- risco: schema não aplicado causar falha de métricas.
- mitigacao: garantir sincronização Prisma antes de subir runtime.
