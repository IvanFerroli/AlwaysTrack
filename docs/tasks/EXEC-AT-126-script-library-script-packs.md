# EXEC-AT-126 - Pacotes e roteiros da Scriptoteca

## Metadata
- status: completed
- task: TASK-AT-126
- date: 2026-06-18

## Entrega
1. Adicionados `ScriptPack` e `ScriptPackItem` com migration SQLite, mantendo scripts como fonte canonica do texto.
2. API da Scriptoteca agora lista pacotes junto dos scripts e permite criar/atualizar roteiros por Supervisor/Admin.
3. Modo atendimento exibe roteiros com passos numerados, placeholders compartilhados e copia individual por passo.
4. Gestao da Scriptoteca ganhou formulario para criar pacotes a partir de scripts existentes.
5. Seed demo cria o roteiro `Triagem de saúde com possível reversa`.

## Arquivos principais
- `services/api/prisma/schema.prisma`
- `services/api/prisma/migrations/20260618143000_script_packs/migration.sql`
- `services/api/src/core/script-library/script-library.service.ts`
- `apps/web/src/views/script-library.tsx`
- `services/api/prisma/seed.ts`

## Validacao esperada
- `npm run prisma:generate`
- `npm run db:test:migrations`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- script-library`

## Risco residual
- A UI cria pacotes, mas ainda nao oferece edicao visual de pacotes existentes. A rota `PATCH /v1/script-library/packs/:packId` fica pronta para esse follow-up.
