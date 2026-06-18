# EXEC-AT-135 - Governanca e versionamento de Fluxos de Atendimento

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-135-service-flow-governance-and-versioning.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- Adicionados campos de governanca em `ServiceFlow`: `version`, `reviewComment`, `reviewDueAt`, `reviewedById` e `reviewedAt`.
- Criado `ServiceFlowRevision` com snapshot JSON versionado do fluxo e suas etapas/scripts.
- Criadas acoes de publicar e arquivar fluxo com comentario obrigatorio.
- Publicacao incrementa versao, registra auditoria e envia notificacao in-app para roles comerciais.
- A tela de Fluxos exibe versao, status, revisor, prazo de revisao, comentario e historico recente.

## Arquivos principais
- `services/api/prisma/schema.prisma`
- `services/api/prisma/migrations/20260618113000_service_flow_governance_metrics/migration.sql`
- `services/api/src/core/service-flows/service-flows.service.ts`
- `services/api/src/core/service-flows/service-flows.handlers.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npx prisma generate --schema services/api/prisma/schema.prisma`
- `npm run up -- --setup-only --skip-install --no-docs`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Ainda nao ha diff visual entre versoes; o snapshot ja existe para sustentar isso depois.
