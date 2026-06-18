# EXEC-AT-130 - Fluxos de atendimento guiado MVP

## Resultado
- status: completed-mvp
- date: 2026-06-18
- task: docs/tasks/TASK-AT-130-service-flow-engine-mvp.md

## Roteamento Olympus
- taskyfier_mode: formalizacao da nova frente Fluxos de Atendimento
- orchestrator_mode: implementacao do nucleo critico

## Entrega
Criada a primeira versao de Fluxos de Atendimento, conectando Wiki, Scriptoteca e atendimento SAC.

## Arquivos
- `services/api/prisma/schema.prisma`
- `services/api/src/core/service-flows/service-flows.service.ts`
- `services/api/src/core/service-flows/service-flows.handlers.ts`
- `services/api/src/app.ts`
- `services/api/prisma/seed.ts`
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npx prisma generate --schema services/api/prisma/schema.prisma`
- `npm run up -- --setup-only --skip-install --no-docs`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- Sem migration SQL dedicada ainda; o `up` aplica diff local.
- Editor e versionamento de fluxos ainda sao MVP.
- Checklist de atendimento ainda nao salva execucao por cliente.
