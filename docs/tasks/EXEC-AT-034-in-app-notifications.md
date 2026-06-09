# EXEC-AT-034 - In-app notifications

## Metadata
- execution-id: EXEC-AT-034
- task: TASK-AT-044-in-app-notification-center-events.md
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-09

## Objetivo
Entregar um MVP de notificacoes internas no app para eventos de notas, Wiki e FAQ, com estado lido/nao lido por usuario e sem ativar canais externos.

## Arquivos alterados
1. `services/api/prisma/schema.prisma`
2. `services/api/prisma/migrations/20260609003000_in_app_notifications/migration.sql`
3. `services/api/src/core/notifications/notifications.service.ts`
4. `services/api/src/core/notifications/notifications.handlers.ts`
5. `services/api/src/core/notifications/notifications.service.test.ts`
6. `services/api/src/core/sales-documents/sales-documents.service.ts`
7. `services/api/src/core/wiki/wiki.service.ts`
8. `services/api/src/core/faq/faq.service.ts`
9. `services/api/src/app.ts`
10. `apps/web/src/main.tsx`
11. `apps/web/src/styles.css`
12. `docs/tasks/TASK-AT-044-in-app-notification-center-events.md`
13. `docs/tasks/ROADMAP.md`
14. `docs/operations/orchestrator-state.md`

## Entrega
1. Novo modelo `InAppNotification` com organizacao, destinatario, tipo, titulo, corpo, entidade, href, dedupe e `readAt`.
2. API autenticada:
   - `GET /v1/in-app-notifications`
   - `POST /v1/in-app-notifications/:notificationId/read`
   - `POST /v1/in-app-notifications/read-all`
3. Emissor interno `emitInAppNotifications`, com destinatarios por usuario e/ou role, dedupe por destinatario e exclusao do ator.
4. Notas emitem eventos `sales_document.approved`, `sales_document.rejected`, `sales_document.reviewed` e `sales_document.commented`.
5. Wiki emite eventos `wiki.request.created`, `wiki.request.approved`, `wiki.request.rejected` e `wiki.page.published`.
6. FAQ emite eventos `faq.thread.created`, `faq.thread.commented`, `faq.thread.reacted`, `faq.thread.state_changed` e `faq.thread.promoted_to_wiki`.
7. UI ganhou centro de notificacoes no topo, com badge de nao lidas, lista recente, abrir destino e marcar uma/todas como lidas.

## Decisoes
- O MVP nao usa `NotificationJob`, WhatsApp, email, push ou WebSocket.
- Links internos usam destinos existentes: `/notas`, `/faq` e `/wiki/<slug>`.
- Notificacoes nao sao enviadas para o proprio ator, reduzindo ruido operacional.
- Como o banco local tinha drift previo, a migration foi criada manualmente e aplicada com `prisma db execute`, sem reset local.

## Validacao
- `npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260609003000_in_app_notifications/migration.sql`: passou.
- `npm run test --workspace @alwaystrack/api -- notifications.service.test.ts faq.service.test.ts wiki.service.test.ts sales-documents.service.test.ts`: passou, 64 testes.
- `npm run typecheck --workspace @alwaystrack/api`: passou.
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run build --workspace @alwaystrack/web`: passou.
- `npm run check`: passou, 26 arquivos de teste e 169 testes.

## Riscos residuais
- Ainda nao ha deep link para uma thread FAQ especifica ou nota especifica; os links levam para a tela operacional correspondente.
- Sem realtime/WebSocket, o badge atualiza ao carregar e ao abrir o centro; polling automatico pode entrar depois se a operacao pedir.
- Destinatarios foram mantidos conservadores; pode haver ajuste fino depois que o time usar em producao.
