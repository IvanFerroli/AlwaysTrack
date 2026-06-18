# EXEC-AT-136 - Metricas de uso dos Fluxos de Atendimento

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-136-service-flow-analytics.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- Criado `ServiceFlowSearchEvent` para registrar buscas sem resultado.
- Criado endpoint gerencial `/v1/service-flows/metrics/summary`.
- A tela de Fluxos exibe metricas agregadas: fluxos publicados, revisoes vencidas, sessoes abertas, fluxos mais usados, etapas com pendencia, scripts copiados dentro de fluxo e buscas sem fluxo.
- As metricas evitam vigilancia individual e focam em melhoria de processo/treinamento.

## Arquivos principais
- `services/api/prisma/schema.prisma`
- `services/api/src/core/service-flows/service-flows.service.ts`
- `services/api/src/core/service-flows/service-flows.handlers.ts`
- `apps/web/src/views/service-flows.tsx`

## Validacao
- `npm run up -- --setup-only --skip-install --no-docs`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Ainda nao ha geracao automatica de tasks a partir de lacunas; as buscas sem resultado ja ficam visiveis para curadoria manual.
