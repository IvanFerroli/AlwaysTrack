# Orchestrator State - AlwaysTrack Product Buildout

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-06-11
- source-of-truth: docs/operations/orchestrator-state.md

## Ciclo ativo
Buildout do produto AlwaysTrack como ferramenta comercial para empresa de suplementos: upload de DANFE por vendedor, extracao, ranking, campanhas, dashboard e extratos.

Fronteira definida em: `docs/adr/ADR-002-fronteira-template-alwaystrack.md`

## Trilha concluida de transicao (ROADMAP item ordem)
| Item | Descricao | Status |
| --- | --- | --- |
| 1 | Resolver P0 de higiene e seguranca | completed (b74975c, 8fb6957) |
| 2 | Sincronizar docs com runtime real | completed (b89fa06, bca395c, EXEC-TMP-002) |
| 3 | Definir fronteira do template | completed (ADR-002 em 1d6fa57) |
| 4 | Escolher contrato de producao banco/storage | completed (ADR-003, ADR-004 em EXEC-TMP-003) |
| 5 | Parametrizar marca, seed, tenant publico, templates | completed para a fronteira atual (EXEC-TMP-004, EXEC-TMP-006, EXEC-TMP-007) |
| 6 | Validar em clone limpo | completed (EXEC-TMP-008: git clone + npm install + npm run setup + npm run check) |

## Ultimo ciclo executado
- EXEC-AT-020 (2026-06-04): Google login como entrada principal com OAuth separado de Sheets/importacao.
- EXEC-AT-021 (2026-06-04): seed/flush local comercial por padrao com fixtures SyLembra default-off.
- EXEC-AT-022 (2026-06-04): filtro visual por vendedor no ranking e comparacao leve entre snapshots recentes.
- EXEC-AT-023 (2026-06-04): consolidacoes backend de extratos por vendedor/grupo.
- EXEC-AT-024 (2026-06-04): smoke/e2e do fluxo comercial com upload XML/PDF ate ranking/extratos.
- EXEC-AT-025 (2026-06-04): UI de consolidacoes de extratos por vendedor/grupo.
- EXEC-AT-026 (2026-06-08): fila operacional de aprovacao de notas com filtros por envio/vendedor/status, selecao multipla, select all visivel, acoes em lote de aprovar/rejeitar e comentario auditavel.
- EXEC-AT-027 (2026-06-08): dedupe interno de pacote deterministico e feedback observavel do reprocessamento.
- EXEC-AT-028 (2026-06-08): setup do gate de ranking com tres vendedores, endpoint de vendedores e upload administrativo por vendedor.
- EXEC-AT-029 (2026-06-08): acesso autenticado da Wiki por slug publicado.
- EXEC-AT-030 (2026-06-08): comentarios/notas de decisao em review Wiki visiveis no historico.
- EXEC-AT-031 (2026-06-08): `Como usar` comercial e icones `i` contextuais nos fluxos ativos.
- EXEC-AT-032 (2026-06-09): CRUD administrativo comercial de usuarios/roles em `Usuarios/Times`.
- EXEC-AT-033 (2026-06-09): FAQ interna em threads e promocao de thread para Wiki com backlink.
- EXEC-AT-034 (2026-06-09): notificacoes in-app para eventos de notas, Wiki e FAQ.
- EXEC-AT-035 (2026-06-09): validacao final do ranking e do reprocessamento idempotente sem duplicata falsa.
- EXEC-AT-036 (2026-06-09): estrategia de testes, scripts separados, TypeDoc e arquitetura transversal.
- EXEC-AT-037 (2026-06-09): Playwright smoke isolado, migration gate, Artillery smoke/1000, CI e onboarding.
- EXEC-AT-038 (2026-06-09): observabilidade HTTP/Prisma e inventario de hotspots de hardening.
- EXEC-AT-039 (2026-06-09): ADR/piloto BullMQ para snapshots de ranking e extracao do cliente API web.
- EXEC-AT-040 (2026-06-09): polimento visual de logo e overflow de botoes/listas na Wiki/FAQ.
- EXEC-AT-041 (2026-06-09): regressao Playwright API para FAQ->Wiki, notificacoes e criacao/listagem de usuario.
- EXEC-AT-042 (2026-06-09): status observavel para job piloto BullMQ/inline de snapshots de ranking.
- EXEC-AT-043 (2026-06-10): UI de Campanhas conectada ao status observavel do job de snapshots de ranking.
- EXEC-AT-044 (2026-06-10): contratos/helpers comerciais frontend extraidos para `apps/web/src/sales.ts`.
- EXEC-AT-045 (2026-06-10): view de Campanhas extraida para `apps/web/src/views/campaigns.tsx`.
- EXEC-AT-046 (2026-06-10): view de Ranking extraida para `apps/web/src/views/ranking.tsx`.
- EXEC-AT-047 (2026-06-10): views de Dashboard e Extratos extraidas para `apps/web/src/views/dashboard.tsx` e `apps/web/src/views/statements.tsx`.
- EXEC-AT-048 (2026-06-10): views de FAQ e Auditoria extraidas para `apps/web/src/views/faq.tsx` e `apps/web/src/views/audit.tsx`.
- EXEC-AT-049 (2026-06-10): view de Usuarios/Times extraida para `apps/web/src/views/users-teams.tsx`.
- EXEC-AT-050 (2026-06-10): view de Notas extraida para `apps/web/src/views/notes.tsx`.
- EXEC-AT-051 (2026-06-10): view Como usar extraida para `apps/web/src/views/help.tsx`.
- EXEC-AT-052 (2026-06-11): view Wiki e centro de notificacoes extraidos para modulos dedicados.
- EXEC-AT-053 (2026-06-11): regressao Playwright browser para upload/aprovacao DANFE e review Wiki.
- EXEC-AT-054 (2026-06-11): validacao BullMQ com Redis real via teste opcional, CI dedicado, compose e env guard.
- EXEC-AT-055 (2026-06-11): workflow de report Artillery com diagnosticos antes/depois e bloqueio de 1000 em localhost.

## Proximo ciclo a rotar
- Novo backlog de reta final criado em 2026-06-11: `TASK-AT-057` a `TASK-AT-066`, cobrindo autenticacao interna, recuperacao de senha, perfil, dashboard grafico, tags/busca Wiki/FAQ, matriz de permissoes, configuracoes, exports, prontidao de demo e polimento visual por prints.
- Prioridade recomendada:
  1. `TASK-AT-057`: restringir Google login por dominio corporativo e documentar configuracao externa.
  2. `TASK-AT-058`: reset de senha por admin.
  3. `TASK-AT-060`: grafico dinamico no dashboard.
  4. `TASK-AT-061`: tags e busca combinada em Wiki/FAQ.
  5. `TASK-AT-059`: pagina de perfil.
  6. `TASK-AT-062` a `TASK-AT-065`: permissoes, configuracoes, exports e demo readiness.
  7. `TASK-AT-066`: visual polish somente depois de prints do usuario.
- Residual tecnico anterior: `TASK-AT-051` ainda precisa de execucao stage/producao-like para provar 1000 usuarios; `TASK-AT-053` depende desse report para otimizacao comprovada.
- Remover/descontinuar legado SyLembra em fases.
- Se houver beta externo, acompanhar o residual `npm audit` moderado em `exceljs`/`uuid`; audit completo tambem mostra moderadas dev vindas de Artillery via `artillery-plugin-fake-data`/`@ngneat/falso`/`uuid`.
- Evitar reabrir tasks de licencas/compliance como backlog AlwaysTrack.

## Blockers conhecidos
- `TASK-AT-066` bloqueada ate o usuario enviar prints dos problemas visuais.
- Residual conhecido: legado SyLembra ainda existe no codigo como porao tecnico temporario; UI ativa ja aponta para o produto comercial.

## Estado dos gates
| Gate | Resultado | Data |
| --- | --- | --- |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 17 testes | 2026-06-08 (EXEC-AT-026) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-08 (EXEC-AT-026) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-026) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 18 testes | 2026-06-08 (EXEC-AT-027) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-08 (EXEC-AT-027) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-027) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-027) |
| npm run prisma:seed | passou — 3 vendedores ativos confirmados | 2026-06-08 (EXEC-AT-028) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 19 testes | 2026-06-08 (EXEC-AT-028) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-08 (EXEC-AT-028) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-028) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-028) |
| npm run check | passou — 156 testes | 2026-06-08 (pre EXEC-AT-029) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 17 testes | 2026-06-08 (EXEC-AT-029) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-08 (EXEC-AT-029) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-029) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-029) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 18 testes | 2026-06-08 (EXEC-AT-030) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-08 (EXEC-AT-030) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-030) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-030) |
| npm run check | passou — 159 testes | 2026-06-08 (post EXEC-AT-030) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-031) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-08 (EXEC-AT-031) |
| npm run check | passou — 159 testes | 2026-06-08 (EXEC-AT-031) |
| npm run test --workspace @alwaystrack/api -- users.service.test.ts | passou — 7 testes | 2026-06-09 (EXEC-AT-032) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-032) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-032) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-032) |
| npm run check | passou — 161 testes | 2026-06-09 (EXEC-AT-032) |
| npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260609001000_faq_threads/migration.sql | passou — migration FAQ aplicada sem reset local | 2026-06-09 (EXEC-AT-033) |
| npm run test --workspace @alwaystrack/api -- faq.service.test.ts wiki.service.test.ts | passou — 32 testes | 2026-06-09 (EXEC-AT-033) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-033) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-033) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-033) |
| npm run check | passou — 167 testes | 2026-06-09 (EXEC-AT-033) |
| npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260609003000_in_app_notifications/migration.sql | passou — migration in-app notifications aplicada sem reset local | 2026-06-09 (EXEC-AT-034) |
| npm run test --workspace @alwaystrack/api -- notifications.service.test.ts faq.service.test.ts wiki.service.test.ts sales-documents.service.test.ts | passou — 64 testes | 2026-06-09 (EXEC-AT-034) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-034) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-034) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-034) |
| npm run check | passou — 169 testes | 2026-06-09 (EXEC-AT-034) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 20 testes | 2026-06-09 (EXEC-AT-035) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-035) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-035) |
| npm run check | passou — 170 testes | 2026-06-09 (EXEC-AT-035) |
| npm run test:unit | passou — 25 arquivos, 168 testes | 2026-06-09 (EXEC-AT-036) |
| npm run test:integration | passou — 1 arquivo, 2 testes | 2026-06-09 (EXEC-AT-036) |
| npm run test:regression | passou — 4 arquivos, 65 testes | 2026-06-09 (EXEC-AT-036) |
| npm run test:all | passou — 26 arquivos, 170 testes + TypeDoc | 2026-06-09 (EXEC-AT-036) |
| npm audit fix | passou parcialmente — removeu critica de dev no Vitest | 2026-06-09 (EXEC-AT-036) |
| npm audit --omit=dev | residual — 2 moderadas via exceljs/uuid | 2026-06-09 (EXEC-AT-036) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-037) |
| npm run db:test:migrations | passou — SQLite vazio, seedado e backup/restore local | 2026-06-09 (EXEC-AT-037) |
| npm run check:docs | passou — TypeDoc gerado | 2026-06-09 (EXEC-AT-037) |
| SEED_ADMIN_PASSWORD=AlwaysTrackE2E123! npm run perf:smoke -- --target=http://localhost:3334 | passou — 160 respostas 200, p95 ~31ms | 2026-06-09 (EXEC-AT-037) |
| npm run test:e2e -- --project=desktop | bloqueado localmente — falta libnspr4.so; CI instala deps com Playwright | 2026-06-09 (EXEC-AT-037) |
| npm audit --omit=dev | residual — 2 moderadas via exceljs/uuid | 2026-06-09 (EXEC-AT-037) |
| npm audit | residual — 5 moderadas, incluindo dev deps do Artillery | 2026-06-09 (EXEC-AT-037) |
| npm run test --workspace @alwaystrack/api -- http-metrics.test.ts | passou — 1 teste | 2026-06-09 (EXEC-AT-038) |
| npm run test:all | passou — 27 arquivos, 171 testes + TypeDoc | 2026-06-09 (EXEC-AT-038) |
| npm run db:test:migrations | passou — SQLite vazio, seedado e backup/restore local | 2026-06-09 (EXEC-AT-038) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-038) |
| npm run test --workspace @alwaystrack/api -- ranking-snapshot.jobs.test.ts sales-documents.service.test.ts | passou — 22 testes | 2026-06-09 (EXEC-AT-039) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-039) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-039) |
| npm run test:all | passou — 28 arquivos, 173 testes + TypeDoc | 2026-06-09 (EXEC-AT-039) |
| npm run db:test:migrations | passou — SQLite vazio, seedado e backup/restore local | 2026-06-09 (EXEC-AT-039) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-039) |
| npm audit --omit=dev | residual — 2 moderadas via exceljs/uuid | 2026-06-09 (EXEC-AT-039) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-040) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-09 (EXEC-AT-040) |
| npm run test:all | passou — 28 arquivos, 173 testes + TypeDoc | 2026-06-09 (EXEC-AT-040) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-040) |
| npm run test:e2e -- --project=api | passou — FAQ->Wiki/notificacoes e usuarios API | 2026-06-09 (EXEC-AT-041) |
| npm run test:all | passou — 28 arquivos, 173 testes + TypeDoc | 2026-06-09 (EXEC-AT-041) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-041) |
| npm run test --workspace @alwaystrack/api -- ranking-snapshot.jobs.test.ts | passou — 3 testes | 2026-06-09 (EXEC-AT-042) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-09 (EXEC-AT-042) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-09 (EXEC-AT-042) |
| npm run repo:hygiene | passou | 2026-06-09 (EXEC-AT-042) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-043) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-043) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-043) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-043) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-044) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-044) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-044) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-044) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-045) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-045) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-045) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-045) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-046) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-046) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-046) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-046) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-047) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-047) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-047) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-047) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-048) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-048) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-048) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-048) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-049) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-049) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-049) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-049) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-050) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-050) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-050) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-050) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-051) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-10 (EXEC-AT-051) |
| npm run test:all | passou — 28 arquivos, 174 testes + TypeDoc | 2026-06-10 (EXEC-AT-051) |
| npm run repo:hygiene | passou | 2026-06-10 (EXEC-AT-051) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-11 (EXEC-AT-052) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-11 (EXEC-AT-053/054) |
| npm run test:e2e -- --project=api | passou — 2 testes API | 2026-06-11 (EXEC-AT-053) |
| npm run test:e2e -- --project=desktop | bloqueado localmente — falta libnspr4.so; CI instala deps com Playwright | 2026-06-11 (EXEC-AT-053) |
| npm run test --workspace @alwaystrack/api -- ranking-snapshot.jobs.test.ts queue.redis.test.ts | passou — 3 testes, 1 skip Redis local | 2026-06-11 (EXEC-AT-054) |
| JOB_QUEUE_DRIVER=inline npm run env:check | passou | 2026-06-11 (EXEC-AT-054) |
| JOB_QUEUE_DRIVER=bullmq REDIS_URL=redis://127.0.0.1:6379 npm run env:check | passou | 2026-06-11 (EXEC-AT-054) |
| node --check scripts/perf-report.js | passou | 2026-06-11 (EXEC-AT-055) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-11 (EXEC-AT-052/053) |
| npm run test:all | passou — 28 arquivos, 174 testes + 1 skip Redis + TypeDoc | 2026-06-11 (EXEC-AT-052..055) |
| npm run repo:hygiene | passou | 2026-06-11 (EXEC-AT-052..055) |
| npm run db:test:migrations | passou — SQLite vazio, seedado e backup/restore local | 2026-06-11 (EXEC-AT-052..055) |
| npm run check | passou — 114 testes | 2026-05-28 |
| npm run check | passou — 115 testes | 2026-05-29 |
| npm run check | passou — 116 testes | 2026-05-29 |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-TMP-009) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-001) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-002) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-003) |
| npm run check | passou — 124 testes | 2026-05-29 (EXEC-AT-004) |
| npm run check | passou — 125 testes | 2026-05-29 (EXEC-AT-005) |
| npm run check | passou — 129 testes | 2026-05-29 (EXEC-AT-006) |
| main operational flow e2e | ampliado — evidencia auditoria/upload/notificacao | 2026-05-29 (EXEC-AT-003) |
| clone limpo: git clone + npm install + npm run setup + npm run check | passou — 116 testes | 2026-05-29 |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-28 |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-003) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-004) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-005) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-006) |
| APP_NAME=OpsCore VITE_APP_NAME=OpsCore npm run build --workspace @alwaystrack/web | passou | 2026-05-29 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-28 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-29 |
| npm run test --workspace @alwaystrack/api | passou — 115 testes | 2026-05-29 |
| npm audit --omit=dev | residual — 2 moderadas via exceljs/uuid | 2026-05-29 |
| env:check --production com URLs publicas e secret forte | passou | 2026-05-29 |
| env:check --production com secret curto / localhost / loopback | falhou como esperado | 2026-05-29 |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-001) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-002) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-003) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-004) |
| npm run setup | passou — seed local aplicado | 2026-05-29 (EXEC-AT-002) |
| npm run setup | passou — wiki migration e seed local aplicados | 2026-05-29 (EXEC-AT-004) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/wiki | 2026-05-29 (EXEC-AT-005) |
| npm run setup | passou — sales migration e seed comercial aplicados | 2026-05-29 (EXEC-AT-006) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard comercial/notas/wiki | 2026-05-29 (EXEC-AT-006) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-007) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-007) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 8 testes | 2026-05-30 (EXEC-AT-007) |
| npm run check | passou — 133 testes | 2026-05-30 (EXEC-AT-007) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-007) |
| npm run smoke:beta-local | passou — dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-007) |
| GitHub Actions check.yml | versionado — npm ci + setup + check | 2026-05-29 |
| docs/tasks sem manifests historicos TASK-* | passou — 58 tasks arquivadas em docs/archive/sylembra/tasks/ | 2026-05-29 |
| trilha TASK-AT inicial | criada — baseline + runtime copy/seed cleanup | 2026-05-29 |
| contrato seed local | alias db:flush:local + fallback legado FLUSH_DEMO_* | 2026-05-29 |
| wiki MVP | schema + API + UI /wiki + service tests | 2026-05-29 (EXEC-AT-004) |
| beta readiness gate | documentado em docs/operations/beta-readiness-gate-2026-05-29.md | 2026-05-29 (EXEC-AT-004) |
| wiki hardening | comparacao + rascunho local + preview admin | 2026-05-29 (EXEC-AT-005) |
| dashboard action center | metricas/filas wiki e atalhos operacionais | 2026-05-29 (EXEC-AT-005) |
| pivot comercial | roles + schema vendas + upload DANFE + UI ativa comercial | 2026-05-29 (EXEC-AT-006) |
| DANFE comercial | extracao IA + revisao MVP + ranking/campanhas read-only + extratos | 2026-05-30 (EXEC-AT-007) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-008) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-008) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 10 testes | 2026-05-30 (EXEC-AT-008) |
| npm run check | passou — 135 testes | 2026-05-30 (EXEC-AT-008) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-008) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-008) |
| PDF real DANFE textual | passou — 28 DANFEs completas via deterministic-pdf-text, sem IA | 2026-05-30 (EXEC-AT-008) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-009) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-009) |
| npm run check | passou — 135 testes | 2026-05-30 (EXEC-AT-009) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-009) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-009) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-010) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-010) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 11 testes | 2026-05-30 (EXEC-AT-010) |
| npm run check | passou — 136 testes | 2026-05-30 (EXEC-AT-010) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-010) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-010) |
| smoke manual XML NF-e | passou — upload criou PENDING_REVIEW com deterministic-nfe-xml | 2026-05-30 (EXEC-AT-010) |
| planejamento Wiki rica | concluido — tasks AT-029 a AT-036 | 2026-05-30 (EXEC-AT-011) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-012) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-012) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 9 testes | 2026-06-03 (EXEC-AT-012) |
| npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts | passou — 1 teste | 2026-06-03 (EXEC-AT-012) |
| npm run check | passou — 136 testes | 2026-06-03 (EXEC-AT-012) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-012) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-06-03 (EXEC-AT-012) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-013) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 13 testes | 2026-06-03 (EXEC-AT-013) |
| npm run check | passou — 140 testes | 2026-06-03 (EXEC-AT-013) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-013) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-014) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-014) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 13 testes | 2026-06-03 (EXEC-AT-014) |
| npm run check | passou — 140 testes | 2026-06-03 (EXEC-AT-014) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-014) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 15 testes | 2026-06-03 (EXEC-AT-015) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-015) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-015) |
| npm run test --workspace @alwaystrack/api -- wiki.service.test.ts | passou — 15 testes | 2026-06-03 (EXEC-AT-016) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-016) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-016) |
| npm run check | passou — 142 testes | 2026-06-03 (EXEC-AT-016) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-016) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-017) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-017) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 14 testes | 2026-06-03 (EXEC-AT-018) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-018) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-018) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-018) |
| npm run check | passou — 145 testes | 2026-06-03 (EXEC-AT-018) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-03 (EXEC-AT-019) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-019) |
| npm run check | passou — 145 testes | 2026-06-03 (EXEC-AT-019) |
| npm run build --workspace @alwaystrack/web | passou | 2026-06-03 (EXEC-AT-019) |
| npm run check | passou — 147 testes | 2026-06-04 (batch EXEC-AT-021/022/023) |
| npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts | passou — 2 testes | 2026-06-04 (EXEC-AT-024) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-04 (EXEC-AT-024) |
| npm run check | passou — 148 testes | 2026-06-04 (batch EXEC-AT-024/025) |
| npm run test --workspace @alwaystrack/api -- auth.service.test.ts google-login.service.test.ts google-oauth.service.test.ts | passou — 13 testes | 2026-06-04 (EXEC-AT-020) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-06-04 (EXEC-AT-020) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-06-04 (EXEC-AT-020) |
| npm run check | passou — 153 testes | 2026-06-04 (EXEC-AT-020) |
| git ls-files .tmp-venv-parse/ .openclaw/ | 0 arquivos rastreados | 2026-05-28 |
| credenciais hardcoded | nenhuma encontrada | 2026-05-28 |

## Regra de precedencia aplicada
Task recebida > documento canonico > ADR > spec > task manifest > este estado.
Este arquivo nao e soberano sobre task recebida, canonico ou ADR.
