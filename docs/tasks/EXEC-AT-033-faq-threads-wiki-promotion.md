# EXEC-AT-033 - FAQ threads and Wiki promotion

## Metadata
- execution-id: EXEC-AT-033
- task: TASK-AT-042-faq-threads-mvp.md; TASK-AT-043-faq-promote-thread-to-wiki.md
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-09

## Objetivo
Criar a FAQ interna colaborativa em threads e permitir que admin/superior promova uma thread para pagina da Wiki, mantendo a FAQ original com backlink.

## Arquivos alterados
1. `services/api/prisma/schema.prisma`
2. `services/api/prisma/migrations/20260609001000_faq_threads/migration.sql`
3. `services/api/src/core/faq/faq.service.ts`
4. `services/api/src/core/faq/faq.handlers.ts`
5. `services/api/src/core/faq/faq.service.test.ts`
6. `services/api/src/app.ts`
7. `apps/web/src/main.tsx`
8. `docs/tasks/TASK-AT-042-faq-threads-mvp.md`
9. `docs/tasks/TASK-AT-043-faq-promote-thread-to-wiki.md`
10. `docs/tasks/ROADMAP.md`
11. `docs/operations/orchestrator-state.md`

## Entrega
1. Novos modelos `FaqThread`, `FaqComment` e `FaqReaction`, todos escopados por organizacao.
2. Threads tem autor, titulo, corpo, estados `OPEN`, `ANSWERED`, `RESOLVED` e `ARCHIVED`.
3. Comentarios atualizam a thread para `ANSWERED` e ficam ordenados por data.
4. Reacoes suportam `SAME_DOUBT`, `HELPFUL` e `THANKS`, com unicidade por usuario/tipo/alvo.
5. Rotas autenticadas `/v1/faq/threads` cobrem lista, criacao, comentario, reacao, status e promocao para Wiki.
6. Moderacao de status e promocao ficou restrita a `ADMIN`, `GESTOR` e `SUPERVISOR`.
7. Promocao cria `WikiPage` e `WikiRevision` com Markdown derivado da pergunta e respostas, resolve colisao de slug e grava `wikiPageId`, `promotedAt` e `promotedById`.
8. A nova secao `FAQ` no app autenticado permite buscar, filtrar por status, criar pergunta, comentar, reagir, moderar e abrir a Wiki vinculada.

## Decisoes
- `FaqItem` publico/legado foi preservado e nao acoplado ao novo fluxo interno.
- A promocao para Wiki e idempotente: thread ja promovida retorna o link existente, sem criar pagina duplicada.
- O conteudo promovido copia a discussao inteira da thread como base inicial; curadoria posterior fica na propria Wiki.
- `npx prisma migrate dev` detectou drift no banco local e pediu reset. Para preservar o estado local, a migration foi criada manualmente e aplicada com `prisma db execute`.

## Validacao
- `npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260609001000_faq_threads/migration.sql`: passou.
- `npm run test --workspace @alwaystrack/api -- faq.service.test.ts wiki.service.test.ts`: passou, 32 testes.
- `npm run typecheck --workspace @alwaystrack/api`: passou.
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run build --workspace @alwaystrack/web`: passou.
- `npm run check`: passou, 26 arquivos de teste e 167 testes.

## Riscos residuais
- A UI ainda nao tem deep link para abrir uma thread especifica da FAQ; isso importa mais quando `TASK-AT-044` criar notificacoes com links internos.
- A promocao gera uma pagina Wiki inteira, nao uma secao dentro de pagina existente; foi a menor entrega consistente com slug/backlink.
- Como o banco local tinha drift previo, a aplicacao local recebeu a migration via `db execute`; em ambiente limpo, a pasta de migration versionada deve ser aplicada normalmente.
