# EXEC-AT-082 - Aba de avisos e comunicados internos

## Metadata
- task: TASK-AT-082
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-12

## Entrega
Nova secao `Avisos` para comunicados internos ricos, com menu, atalhos, leitura, editor e links profundos.

## Arquivos principais
- `apps/web/src/views/announcements.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `services/api/src/core/announcements/**`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
