# EXEC-AT-083 - Avisos: modelo de dados e permissoes

## Metadata
- task: TASK-AT-083
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-12

## Entrega
Modelo `Announcement` e `AnnouncementReadReceipt`, permissao canonica e rotas protegidas por roles comerciais.

## Notas
- Publico alvo inicial usa roles em JSON para manter escopo simples.
- Links relacionados tambem ficam em JSON tipado para evitar grafo prematuro.

## Validacao
- `npm run db:test:migrations`
- `npm run test --workspace @alwaystrack/api -- announcements.service.test.ts search.service.test.ts`
