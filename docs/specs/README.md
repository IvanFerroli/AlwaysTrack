# SPEC Surface

## Objetivo
Formalizar mudancas e comportamentos esperados de forma executavel e validavel.

## Quando usar
- detalhar um recorte de capacidade antes de execucao;
- explicitar escopo, restricoes e criterio de aceite;
- reduzir ambiguidade entre planejamento e execucao.

## Convencao minima
- ID: `SPEC-###`
- Arquivo por spec: `SPEC-###-<slug>.md`
- Base inicial: `docs/specs/_template.md`

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Baseline atual de specs
- `SPEC-001` - Job Ingestion
- `SPEC-002` - Job Acquisition
- `SPEC-003` - Job Scraping
- `SPEC-004` - Resume Profile Management
- `SPEC-005` - CV Analysis
- `SPEC-006` - Job Matching
- `SPEC-007` - Deep Score AI
- `SPEC-008` - Strategy Approval Gate
- `SPEC-009` - Application Tracking
- `SPEC-010` - Runtime Observability
- `SPEC-011` - Capability Traceability Matrix

## Fora de escopo
- manifesto de task detalhado;
- implementacao funcional;
- historico de decisao arquitetural (usar ADR para isso).
