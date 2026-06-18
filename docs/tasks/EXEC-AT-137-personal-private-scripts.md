# EXEC-AT-137 - Scripts pessoais privados por atendente

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-137-personal-private-scripts.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- Criados os modelos `PersonalScript` e `PersonalScriptFlow`.
- Adicionados endpoints para listar, criar e sugerir scripts pessoais como canon da Scriptoteca.
- A tela de Fluxos exibe `Meus scripts`, filtra por fluxo selecionado ou scripts sem fluxo fixo, permite copiar e sugerir canon.
- Sugestoes pessoais viram `OperationalScriptSuggestion` e notificam roles de gestao.

## Arquivos principais
- `services/api/prisma/schema.prisma`
- `services/api/prisma/migrations/20260618124500_personal_scripts/migration.sql`
- `services/api/src/core/script-library/script-library.service.ts`
- `services/api/src/core/script-library/script-library.handlers.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npx prisma generate --schema services/api/prisma/schema.prisma`
- `npm run up -- --setup-only --skip-install --no-docs`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Edicao/exclusao/versionamento de scripts pessoais fica para uma proxima fatia se o uso real pedir.
