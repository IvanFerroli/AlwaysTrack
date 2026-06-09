# AlwaysTrack Architecture

## Metadata
- status: active
- owner: architecture-maintainers
- last-updated: 2026-06-09
- source-of-truth: docs/architecture/README.md

## Objetivo
Dar a um dev novo um mapa curto do AlwaysTrack: dominios, fluxos, contratos e onde mexer sem quebrar a operacao comercial.

## Runtime
- Web: React + Vite em `apps/web`.
- API: Express + TypeScript em `services/api`.
- Shared contracts: `packages/shared`.
- Banco local atual: Prisma + SQLite.
- Jobs: inline por padrao; BullMQ + Redis quando `JOB_QUEUE_DRIVER=bullmq`.
- Auth: sessao por cookie, login email/senha e Google login opcional.
- Storage privado local: `.storage/`.

## Dominio ativo
AlwaysTrack e uma plataforma comercial para empresa de suplementos:
1. Vendedores sobem DANFEs.
2. Sistema extrai dados deterministica/IA.
3. Perfis superiores revisam e aprovam/rejeitam.
4. Notas aprovadas alimentam ranking, campanhas, dashboard e extratos.
5. Wiki, FAQ e notificacoes sustentam operacao e conhecimento interno.

O legado SyLembra/licencas/compliance existe apenas como porao tecnico e fica atras de `ENABLE_LEGACY_SYLEMBRA=true`.

## Roles comerciais
- `ADMIN`: administra tudo.
- `GESTOR`: visao ampla operacional.
- `SAC`: apoio/revisao operacional.
- `FINANCEIRO`: revisao/consulta financeira.
- `VENDEDOR`: envia e acompanha suas notas.
- `SUPERVISOR`: acompanha grupo/time.

Todo service precisa respeitar `organizationId` e role do `CurrentUser`.

## Fluxo DANFE -> Ranking
1. `uploadSalesDocument` recebe arquivo e associa a um `SellerProfile`.
2. Extracao deterministica tenta PDF textual/XML antes da IA.
3. `analyzeSalesDocumentWithAi` reprocessa quando necessario e retorna feedback observavel.
4. `reviewSalesDocument` aprova/rejeita/duplica e grava auditoria/notificacao.
5. `getSalesRanking` soma apenas `SalesDocument.status = APPROVED`.
6. `getSalesStatements` usa o mesmo contrato de notas aprovadas.

Arquivos principais:
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/danfe-deterministic.ts`
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `apps/web/src/main.tsx`

## Wiki, FAQ e notificacoes
- Wiki publica paginas por slug autenticado e suporta sugestoes/revisao.
- FAQ interna usa threads, comentarios, reacoes e promocao para Wiki.
- Notificacoes in-app usam `InAppNotification`, nao os jobs legados de WhatsApp.

Arquivos principais:
- `services/api/src/core/wiki/wiki.service.ts`
- `services/api/src/core/faq/faq.service.ts`
- `services/api/src/core/notifications/notifications.service.ts`

## Auth e tenancy
- `auth.service.ts` cria sessao e sanitiza usuario.
- `google-login.service.ts` gerencia OAuth state e allowlist de dominio.
- Middleware `requireAuth` e `requireRole` protege rotas.
- Services ainda devem validar tenant no banco; middleware nao substitui filtro por `organizationId`.

## Seed e ambiente local
- `npm run setup` aplica migrations e seed local.
- Seed comercial padrao cria admin, SAC, financeiro, vendedor, supervisor, grupos e dados comerciais.
- `npm run db:flush:local` recria banco local.
- Fixtures SyLembra antigas so entram com `ENABLE_LEGACY_SYLEMBRA=true`.

## Observabilidade minima atual
- Auditoria registra acoes sensiveis.
- Logs estruturados existem no fluxo de notas/extracao.
- `TASK-AT-053` vai ampliar metricas, queries lentas e profiling.

## Jobs e backpressure
- Contrato canonico: `docs/adr/ADR-005-filas-bullmq-backpressure.md`.
- Piloto atual: snapshot de ranking em `services/api/src/core/jobs/ranking-snapshot.jobs.ts`.
- Worker: `npm run job:ranking-snapshots`.
- Dev local usa driver inline para nao exigir Redis.

## Documentacao gerada
`npm run docs:api` gera TypeDoc em `docs/generated/typedoc`.

Essa documentacao gerada complementa os docs curados. Use TypeDoc para localizar exports e assinaturas; use `docs/architecture` para entender decisoes e fluxos.

## Ordem recomendada para manutencao
1. Leia esta pagina.
2. Rode `npm run setup`.
3. Rode `npm run check`.
4. Leia `docs/testing/strategy.md`.
5. Abra o service do dominio afetado.
6. Adicione teste unitario/regressivo antes de corrigir bug.
