# EXEC-AT-133 - Execucao auditavel de Fluxos de Atendimento

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-133-service-flow-execution-session.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- Criadas tabelas `ServiceFlowSession` e `ServiceFlowSessionStep`.
- Adicionadas rotas para iniciar sessao, registrar etapa, consultar sessao e finalizar atendimento.
- A UI de Fluxos permite iniciar atendimento, registrar decisao, nota interna, pular/reabrir/concluir etapa e finalizar.
- Copias de scripts feitas durante a sessao carregam `serviceFlowSessionId`/`serviceFlowId` no evento de copia, sem salvar placeholders sensiveis.
- Eventos de inicio, etapa e conclusao entram no audit log.

## Arquivos principais
- `services/api/prisma/schema.prisma`
- `services/api/prisma/migrations/20260618100000_service_flow_sessions/migration.sql`
- `services/api/src/core/service-flows/service-flows.service.ts`
- `services/api/src/core/service-flows/service-flows.handlers.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npx prisma generate --schema services/api/prisma/schema.prisma`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- A consulta gerencial/export de sessoes fica para uma proxima fatia se o uso real pedir supervisao agregada.
