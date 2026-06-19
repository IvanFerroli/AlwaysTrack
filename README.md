# AlwaysTrack

AlwaysTrack é uma plataforma interna para operação comercial, governança de conhecimento e atendimento assistido. O produto nasceu para resolver duas dores principais dentro da Always Fit:

1. Toda venda com nota deve virar ranking confiável, auditável e acionável.
2. Todo conhecimento solto deve virar FAQ/Wiki/Scriptoteca consultável, vivo e governado.

Na prática, o AlwaysTrack junta em uma única ferramenta:

- upload e revisão de DANFEs/NFs;
- extração determinística e por IA;
- aprovação/rejeição com comentário;
- ranking explicável por vendedor, período e campanha;
- extratos e exportações;
- timeline/auditoria de notas;
- Wiki versionada;
- FAQ com threads, reações e promoção para Wiki;
- Avisos internos;
- Scriptoteca do SAC com scripts prontos, placeholders, sugestões, pacotes e scripts pessoais;
- Fluxos de atendimento guiado;
- notificações in-app;
- configurações administrativas, usuários, roles e matriz de permissões.

Este README é o mapa de corpo inteiro do projeto. Para detalhes mais específicos, veja também:

- [Roadmap de tasks](docs/tasks/ROADMAP.md)
- [Mapa de domínios](docs/architecture/domains.md)
- [Mapa de manutenção](docs/architecture/maintenance-map.md)
- [Onboarding TypeDoc](docs/architecture/onboarding-typedoc.md)
- [Checklist rápido de diagnóstico](docs/architecture/quick-diagnostic-checklist.md)
- [Threat model](docs/security/threat-model.md)
- [Gate antes de exposição externa](docs/security/external-exposure-release-gate.md)
- [Prontidão Postgres/storage](docs/operations/production-postgres-storage-readiness.md)
- [Runbook de backup/restore](docs/operations/backup-restore-runbook.md)
- [Demo guiada](docs/demo/guided-demo-script.md)

## Estado de Referência deste README

Este README deve ser lido como documentação do próximo estado operacional do AlwaysTrack: considere que o `.env` já foi preenchido corretamente para o ambiente alvo, incluindo Google Login, Postgres, S3-compatible storage, Redis/BullMQ, secrets fortes e URLs HTTPS.

Isso significa que a narrativa principal aqui não é "como o protótipo roda localmente", e sim "como o produto deve operar quando estiver preparado para uso interno sério". O modo local continua documentado porque ele é essencial para desenvolvimento, demo e manutenção, mas o estado de referência é o ambiente configurado.

Resumo do estado de referência:

- autenticação por email/senha e Google Login corporativo;
- domínio Google restrito a `alwaysfit.com.br`;
- banco alvo em Postgres gerenciado;
- storage alvo em S3-compatible privado;
- filas alvo em Redis/BullMQ;
- IA configurável por provider;
- HTTPS, CORS restrito e session secret forte;
- backup e restore dry-run tratados como obrigatórios antes de dados reais;
- observabilidade, auditoria e checks de segurança como parte do processo.

## Estado Atual do Código

O AlwaysTrack está em estado de MVP avançado/produto interno em consolidação. Ele não deve mais ser tratado como protótipo simples.

O produto já possui:

- frontend React modularizado por views;
- API Express com domínios separados;
- Prisma local-first com SQLite;
- migrations versionadas;
- seed comercial;
- auditoria;
- notificações;
- segurança de sessão, CSRF/origin guard, headers, rate limit e validação runtime em fatias críticas;
- docs de arquitetura, segurança, operação, performance e tarefas;
- testes unitários, regressão API, smoke Playwright, relatórios Artillery e coverage HTML;
- workbench local via `npm run up`;
- provider de storage local e adapter S3-compatible;
- preflight para migração futura para Postgres.

O backlog ativo está praticamente limpo. No repositório, o único item restante é a migração real para Postgres, que fica registrada como dependente de infraestrutura externa. Para leitura deste README, assuma que a infraestrutura/env do próximo estado já foi resolvida; para execução técnica, use o preflight:

- `TASK-AT-149-prod-postgres-migration-execution.md`
- status: `blocked-external-infra-ready`
- desbloqueio operacional: banco Postgres gerenciado, credenciais, storage externo, backup e restore dry-run confirmados.

## Tese do Produto

AlwaysTrack deve parecer a nova forma correta de operar:

- vendas com nota fiscal;
- ranking e campanhas comerciais;
- extratos e acompanhamento;
- atendimento SAC;
- conhecimento operacional;
- comunicados internos;
- auditoria e governança.

O produto evita depender de planilhas soltas, mensagens perdidas e conhecimento tribal. O objetivo é transformar cada ação relevante em dado estruturado, revisável e rastreável.

## Fluxos Principais

### 1. DANFE -> revisão -> aprovação -> ranking -> extrato -> auditoria

Fluxo ideal:

1. Vendedor ou admin sobe DANFE/PDF/XML.
2. API valida arquivo, tamanho, tipo real e escopo.
3. Sistema extrai dados de forma determinística quando possível.
4. IA entra como apoio quando configurada.
5. Nota entra em fila de revisão.
6. SAC/Financeiro/Supervisor/Admin revisa.
7. Nota pode ser aprovada, rejeitada, revisada ou comentada.
8. Itens aprovados alimentam ranking/campanhas.
9. Extratos e dashboards refletem apenas dados aceitos.
10. Timeline e auditoria provam quem fez o que, quando e por quê.

Conceitos importantes:

- `SalesDocument`: nota/DANFE enviada.
- `SalesItem`: itens extraídos/aprovados.
- `SellerProfile`: vendedor operacional.
- `SalesGroup`: grupo comercial.
- `SalesCampaign`: regra comercial.
- `RankingSnapshot`: congelamento histórico do ranking.
- `DocumentAiExtraction`: histórico de extração IA.
- `AuditLog`: trilha auditável.

### 2. Dúvida operacional -> FAQ -> curadoria -> Wiki validada

Fluxo ideal:

1. Usuário abre uma pergunta na FAQ.
2. Outros usuários comentam, reagem e ajudam.
3. Usuário superior pode moderar status.
4. Pergunta resolvida pode ser promovida para Wiki.
5. FAQ continua existindo, mas passa a apontar para a Wiki criada.
6. Wiki passa por governança, revisões, comentários e histórico.

Conceitos importantes:

- `FaqThread`: pergunta/thread.
- `FaqComment`: resposta/comentário.
- `FaqReaction`: reação.
- `WikiPage`: página publicada.
- `WikiEditRequest`: proposta de alteração.
- `WikiRevision`: versão histórica.

### 3. Atendimento SAC -> Fluxo -> Scriptoteca -> atendimento padronizado

Fluxo ideal:

1. Atendente escolhe um fluxo de atendimento.
2. Fluxo apresenta etapas, decisões, checklists e orientações.
3. Cada etapa pode sugerir scripts relacionados.
4. Atendente preenche placeholders do script.
5. Sistema gera texto limpo por canal.
6. Copia e uso ficam rastreáveis em métricas.
7. Atendente pode criar scripts pessoais privados.
8. Scripts pessoais podem virar sugestão para admin canonizar.

Conceitos importantes:

- `ServiceFlow`: fluxo de atendimento.
- `ServiceFlowStep`: etapa.
- `ServiceFlowSession`: execução auditável de um fluxo.
- `OperationalScript`: script canônico da Scriptoteca.
- `PersonalScript`: script privado de um usuário.
- `ScriptPack`: roteiro/pacote de scripts.
- `OperationalScriptSuggestion`: sugestão para governança.

### 4. Avisos -> ciência -> notificações

Fluxo ideal:

1. Admin/Gestor cria aviso.
2. Aviso pode ter Markdown, tags, links e vigência.
3. Aviso aparece na área de Avisos e na Central Operacional Hoje.
4. Usuários recebem notificação.
5. Aviso pode exigir ciência.
6. Auditoria registra publicação e arquivamento.

Conceitos importantes:

- `Announcement`: aviso/comunicado.
- `AnnouncementReadReceipt`: leitura/ciência.
- `InAppNotification`: notificação interna.

## Arquitetura

Monorepo npm workspaces:

```text
AlwaysTrack/
  apps/
    web/                  Frontend React + Vite
  services/
    api/                  API Express + Prisma + dominios
  packages/
    shared/               Tipos, roles e contratos compartilhados
  docs/                   Arquitetura, operacao, seguranca, tasks e runbooks
  scripts/                Setup, workbench, preflights, relatorios e checks
  tests/                  Playwright e performance
```

### Frontend

Local principal:

```text
apps/web/src/
```

Características:

- React 19;
- Vite;
- TypeScript;
- views separadas por domínio;
- cliente API central em `apps/web/src/api.ts`;
- componentes reutilizáveis como Markdown editor, notificações e layout;
- CSS principal em `apps/web/src/styles.css`;
- ícones com `lucide-react`.

Views importantes:

- `dashboard.tsx`: Central/Dashboard comercial.
- `notes.tsx`: upload, revisão, diagnóstico e timeline de notas.
- `ranking.tsx`: ranking explicável.
- `statements.tsx`: extratos.
- `campaigns.tsx`: campanhas comerciais.
- `wiki.tsx`: Wiki.
- `faq.tsx`: FAQ/threads.
- `announcements.tsx`: Avisos.
- `script-library.tsx`: Scriptoteca.
- `service-flows.tsx`: Fluxos de atendimento.
- `users-teams.tsx`: usuários, vendedores e grupos.
- `profile.tsx`: perfil.
- `settings.tsx`: configurações.
- `audit.tsx`: auditoria.

### API

Local principal:

```text
services/api/src/
```

Padrão:

- `app.ts` registra rotas, middlewares, auth, roles e rate limits.
- cada domínio tem `*.service.ts` para regra de negocio;
- cada domínio tem `*.handlers.ts` para HTTP;
- testes ficam perto dos services;
- Prisma Client e usado via `services/api/src/core/db/prisma.ts`;
- auditoria central via `recordAuditLog`;
- notificações via domínio de notifications.

Domínios principais:

```text
services/api/src/core/auth
services/api/src/core/users
services/api/src/core/sales-documents
services/api/src/core/wiki
services/api/src/core/faq
services/api/src/core/announcements
services/api/src/core/script-library
services/api/src/core/service-flows
services/api/src/core/attachments
services/api/src/core/notifications
services/api/src/core/audit
services/api/src/core/search
services/api/src/core/operations
services/api/src/core/diagnostics
```

### Shared

Local:

```text
packages/shared/src/
```

Guarda contratos compartilhados entre API e Web:

- roles comerciais;
- tipos de usuário;
- payloads comuns;
- enums/constantes transversais.

Evite duplicar role string diretamente no frontend ou backend quando já houver contrato compartilhado.

## Banco de Dados

Schema:

```text
services/api/prisma/schema.prisma
```

Migrations:

```text
services/api/prisma/migrations/
```

Estado local de desenvolvimento:

- datasource Prisma usa SQLite para desenvolvimento local;
- `DATABASE_URL=file:./dev.db`;
- migrations SQLite versionadas;
- seed comercial default;
- legado SyLembra default-off.

Estado de referência/alvo:

- Postgres gerenciado em staging/produção;
- `DATABASE_URL` apontando para `postgresql://...` no ambiente alvo;
- preflight pronto via `npm run db:postgres:preflight`;
- SQLite preservado apenas para desenvolvimento local e demo.

### Principais modelos

Comercial:

- `SellerProfile`
- `SalesGroup`
- `SalesDocument`
- `SalesItem`
- `SalesCampaign`
- `RankingSnapshot`

Conhecimento:

- `WikiPage`
- `WikiEditRequest`
- `WikiRevision`
- `WikiAttachment`
- `FaqThread`
- `FaqComment`
- `FaqReaction`

Operação:

- `Announcement`
- `AnnouncementReadReceipt`
- `OperationalScript`
- `OperationalScriptRevision`
- `OperationalScriptEvent`
- `OperationalScriptSuggestion`
- `ScriptCategory`
- `ScriptPack`
- `ScriptPackItem`
- `ServiceFlow`
- `ServiceFlowStep`
- `ServiceFlowSession`
- `PersonalScript`
- `OperationalAttachment`

Segurança/auditoria:

- `User`
- `Organization`
- `AuditLog`
- `InAppNotification`
- `GoogleConnection`
- `GoogleOauthState`

## Storage e Arquivos

O projeto tem contrato de storage em:

```text
services/api/src/core/documents/storage.ts
services/api/src/core/documents/storage.provider.ts
```

Providers:

- `local`: default para desenvolvimento.
- `s3`: adapter S3-compatible para produção/staging.

Arquivos sensíveis:

- DANFEs/PDF/XML;
- imagens da Wiki;
- anexos operacionais de Avisos, FAQ, Fluxos e Scriptoteca;
- avatars/configurações quando aplicável.

Importante:

- storage local grava em `.storage/private`;
- storage externo deve ser bucket privado;
- download deve continuar autenticado/proxiado pela API;
- não commitar `.storage`, bancos locais, backups ou arquivos fiscais.

## Autenticação e Autorização

### Login tradicional

Existe login por email/senha com sessão por cookie. Admin pode resetar senha de usuários.

### Login com Google

O projeto também suporta login com Google restrito por domínio corporativo.

Variáveis:

```env
GOOGLE_LOGIN_CLIENT_ID=""
GOOGLE_LOGIN_CLIENT_SECRET=""
GOOGLE_LOGIN_REDIRECT_URI=""
GOOGLE_LOGIN_ALLOWED_DOMAINS="alwaysfit.com.br"
```

Redirect local esperado:

```env
GOOGLE_LOGIN_REDIRECT_URI="http://localhost:3333/v1/auth/google/callback"
```

Redirect de produção esperado:

```env
GOOGLE_LOGIN_REDIRECT_URI="https://SEU_DOMINIO/v1/auth/google/callback"
```

No Google Cloud Console, o redirect precisa estar exatamente cadastrado em Authorized redirect URIs.

### Beta fechado por allowlist

Para homologação local controlada, use `APP_MODE=beta-local` na API e `VITE_APP_MODE=beta-local` no frontend. Nesse modo, login tradicional e Google Login só aceitam emails listados em `BETA_ALLOWED_EMAILS`.

```env
APP_MODE="beta-local"
VITE_APP_MODE="beta-local"
BETA_ALLOWED_EMAILS="admin@alwaysfit.com.br,vendedor@alwaysfit.com.br,sac@alwaysfit.com.br"
```

Allowlist define quem entra. Role define o que cada usuário pode fazer depois de entrar.

### Roles

Roles comerciais canonicas:

- `SAC`
- `VENDEDOR`
- `SUPERVISOR`
- `FINANCEIRO`
- `GESTOR`
- `ADMIN`

A matriz visual/canônica fica em:

```text
docs/security/commercial-permission-matrix.md
```

Regra geral:

- `VENDEDOR`: envia e acompanha suas notas.
- `SAC`: consulta conhecimento, scriptoteca, fluxos e pode apoiar revisão.
- `SUPERVISOR`: opera time/grupo e acompanha ranking.
- `FINANCEIRO`: foco em notas, extratos e revisão financeira.
- `GESTOR`: operação ampla, campanhas, comunicados e governança.
- `ADMIN`: usuários, configurações, auditoria, Wiki publicada e integrações.

## Configuração de Ambiente

Arquivo base:

```text
.env.example
```

Arquivo local:

```text
.env
```

Nunca commite `.env`, secrets, bancos locais ou arquivos fiscais.

### Local mínimo

Para rodar local com defaults:

```env
NODE_ENV="development"
APP_NAME="AlwaysTrack"
DATABASE_URL="file:./dev.db"
SESSION_SECRET="um-segredo-local-forte"
API_PORT="3333"
CORS_ORIGIN="http://localhost:5173"
VITE_API_BASE_URL=""
VITE_APP_NAME="AlwaysTrack"
STORAGE_PROVIDER="local"
STORAGE_LOCAL_DIR=".storage/private"
DOCUMENT_AI_PROVIDER="fake"
NOTIFICATION_PROVIDER="fake"
JOB_QUEUE_DRIVER="inline"
ENABLE_LEGACY_SYLEMBRA="false"
```

### Env do estado de referência

Para o estado de referência deste README, considere este bloco preenchido com valores reais no secret manager ou no ambiente de deploy. Os valores abaixo mostram formato e intencao, não secrets reais:

```env
NODE_ENV="production"
DATABASE_URL="postgresql://..."
POSTGRES_DATABASE_URL="postgresql://..."
POSTGRES_BACKUP_CONFIRMED="true"
POSTGRES_RESTORE_DRY_RUN_CONFIRMED="true"
SESSION_SECRET="valor-forte-com-32+-chars"
CORS_ORIGIN="https://SEU_DOMINIO"
VITE_API_BASE_URL="https://SEU_DOMINIO"

STORAGE_PROVIDER="s3"
STORAGE_S3_ENDPOINT="https://..."
STORAGE_S3_BUCKET="..."
STORAGE_S3_REGION="us-east-1"
STORAGE_S3_ACCESS_KEY_ID="..."
STORAGE_S3_SECRET_ACCESS_KEY="..."
STORAGE_S3_FORCE_PATH_STYLE="true"

GOOGLE_LOGIN_CLIENT_ID="..."
GOOGLE_LOGIN_CLIENT_SECRET="..."
GOOGLE_LOGIN_REDIRECT_URI="https://SEU_DOMINIO/v1/auth/google/callback"
GOOGLE_LOGIN_ALLOWED_DOMAINS="alwaysfit.com.br"
APP_MODE="production"

JOB_QUEUE_DRIVER="bullmq"
REDIS_URL="redis://..."
JOB_CONCURRENCY="2"
```

### Grupos de variáveis

API:

- `NODE_ENV`
- `APP_NAME`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`
- `API_PORT`
- `CORS_ORIGIN`

Web:

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
- `VITE_DEMO_MODE`

Storage:

- `STORAGE_PROVIDER`
- `STORAGE_LOCAL_DIR`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_BUCKET`
- `STORAGE_S3_REGION`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_S3_FORCE_PATH_STYLE`
- `DOCUMENT_MAX_BYTES`

Google Login:

- `GOOGLE_LOGIN_CLIENT_ID`
- `GOOGLE_LOGIN_CLIENT_SECRET`
- `GOOGLE_LOGIN_REDIRECT_URI`
- `GOOGLE_LOGIN_ALLOWED_DOMAINS`

Google Sheets/Drive:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_TEMPLATE_FOLDER_ID`
- `GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL`
- `GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`

IA:

- `DOCUMENT_AI_PROVIDER`
- `DOCUMENT_AI_MODEL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

WhatsApp/Meta:

- `NOTIFICATION_PROVIDER`
- `META_WHATSAPP_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_WHATSAPP_SMOKE_TO`
- `META_WHATSAPP_SMOKE_TEMPLATE`
- `META_WHATSAPP_SMOKE_TEMPLATE_LANGUAGE`

Jobs:

- `JOB_QUEUE_DRIVER`
- `REDIS_URL`
- `JOB_CONCURRENCY`
- `NOTIFICATION_JOB_LIMIT`

Observabilidade:

- `HTTP_METRICS_SLOW_MS`
- `PRISMA_SLOW_QUERY_MS`

Seed/demo:

- `SEED_ORGANIZATION_ID`
- `SEED_ORGANIZATION_NAME`
- `SEED_ADMIN_PASSWORD`
- `SEED_SAC_PASSWORD`
- `SEED_FINANCEIRO_PASSWORD`
- `SEED_SELLER_PASSWORD`
- `SEED_SUPERVISOR_PASSWORD`
- `SEED_UPLOAD_TOKEN`
- `FLUSH_LOCAL_ORGANIZATION_NAME`
- `FLUSH_LOCAL_ADMIN_NAME`
- `FLUSH_LOCAL_ADMIN_EMAIL`
- `FLUSH_LOCAL_ADMIN_PASSWORD`

Legado:

- `ENABLE_LEGACY_SYLEMBRA`
- `SEED_RT_PASSWORD`

## Como Rodar Localmente

Instalar dependencias:

```bash
npm install
```

Gerar Prisma Client:

```bash
npm run prisma:generate
```

Rodar setup local:

```bash
npm run setup
```

Subir bancada completa:

```bash
npm run up
```

O `npm run up` e a bancada de estudo local. Ele foi pensado para abrir o que der no navegador: app, Prisma Studio, docs, reports existentes e outros artefatos locais quando disponíveis.

Rodar API:

```bash
npm run dev:api
```

Rodar Web:

```bash
npm run dev:web
```

Seed comercial:

```bash
npm run prisma:seed
```

Reset demo local:

```bash
npm run demo:reset:local
```

Flush local:

```bash
npm run db:flush:local
```

## Scripts Importantes

Qualidade geral:

```bash
npm run check
npm run typecheck
npm run test
npm run lint
```

API:

```bash
npm run typecheck --workspace @alwaystrack/api
npm run test --workspace @alwaystrack/api
npm run coverage:html --workspace @alwaystrack/api
```

Web:

```bash
npm run typecheck --workspace @alwaystrack/web
npm run build --workspace @alwaystrack/web
```

Docs:

```bash
npm run docs:api
npm run check:docs
```

Migrations:

```bash
npm run db:test:migrations
npm run prisma:migrate
```

Postgres preflight:

```bash
npm run db:postgres:preflight
```

Segurança:

```bash
npm run env:check
npm run env:check -- --production
npm run security:deps
```

Playwright:

```bash
npm run test:e2e
npm run test:e2e:smoke
npm run test:e2e:api
```

Performance:

```bash
npm run perf:smoke:report
npm run perf:1000:report
```

Jobs:

```bash
npm run job:notifications
npm run job:ranking-snapshots
npm run test:jobs:redis
```

Smokes externos:

```bash
npm run smoke:whatsapp
npm run smoke:google-sheets
```

## Qualidade e Testes

Camadas existentes:

- unitários com Vitest;
- testes de services;
- testes de validação runtime;
- testes de auth/users/sales/wiki/faq/notifications;
- testes de migrations;
- Playwright API;
- Playwright browser smoke;
- Artillery smoke e cenários de carga;
- coverage HTML da API;
- TypeDoc para onboarding.

Onde procurar:

- `services/api/src/**/*.test.ts`
- `tests/e2e/`
- `tests/performance/`
- `coverage/` ou relatórios gerados localmente
- `docs/architecture/testing-and-docs.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`

Regra prática:

- mexeu em service: teste service.
- mexeu em rota: teste handler/API quando houver risco.
- mexeu em UI: typecheck web e, se fluxo crítico, Playwright.
- mexeu em banco: `npm run db:test:migrations`.
- mexeu em segurança: rode o gate relacionado e atualize docs.
- mexeu em performance: meca antes/depois.

## Segurança

O AlwaysTrack lida com dados sensíveis:

- NFs/DANFEs;
- valores comerciais;
- ranking;
- usuários;
- documentos;
- scripts internos;
- comunicados;
- conhecimento operacional.

Controles já implementados/documentados:

- cookie de sessão;
- roles e `requireRole`;
- Google Login restrito por domínio;
- CSRF/origin guard;
- security headers;
- CORS restrito;
- rate limit por classe de rota;
- validação runtime de payload em fatias críticas;
- upload hardening com MIME e magic bytes;
- auditoria;
- notificações;
- logs com preocupacao de redaction;
- dependency audit;
- runbook de incidente;
- release gate antes de exposição externa.

Docs principais:

- `docs/security/threat-model.md`
- `docs/security/http-perimeter.md`
- `docs/security/security-baseline-audit.md`
- `docs/security/security-events-taxonomy.md`
- `docs/security/external-integrations-security-review.md`
- `docs/security/external-exposure-release-gate.md`
- `docs/operations/security-secrets-runbook.md`
- `docs/operations/security-incident-runbook.md`

Antes de expor fora do localhost, rode e registre:

```bash
npm run env:check -- --production
npm run security:deps
npm run typecheck --workspaces --if-present
npm run test --workspaces --if-present
npm run test:e2e:api
npm run db:test:migrations
```

E, quando houver infra:

```bash
npm run db:postgres:preflight
```

## Performance e Escala

Meta declarada do produto:

- caminhar para suportar cerca de 1000 usuários simultaneos sem lentidao perceptivel.

Já existe:

- paginação server-side em telas críticas;
- filtros combinados em varias telas;
- observabilidade HTTP/Prisma;
- painel mínimo de observabilidade operacional;
- Artillery smoke/report;
- BullMQ piloto/validação com Redis;
- jobs para ranking snapshots e notificações.

Pontos de atenção:

- SQLite e adequado para local/demo, não para produção multiusuario real.
- Para escala real, migrar para Postgres gerenciado.
- Para arquivos reais, usar S3-compatible privado.
- Para jobs reais, usar Redis/BullMQ.
- Para benchmark 1000, não confiar em localhost como única evidência.

Docs:

- `docs/performance/README.md`
- `docs/performance/observability-report-2026-06-09.md`
- `docs/operations/production-postgres-storage-readiness.md`

## IA e Extração de DANFE

O AlwaysTrack usa uma estratégia hibrida:

1. extração determinística quando possível;
2. fallback/apoio por IA quando configurada;
3. diagnóstico e reprocessamento observáveis;
4. correção manual auditável.

Providers:

```env
DOCUMENT_AI_PROVIDER="fake"
DOCUMENT_AI_PROVIDER="gemini"
DOCUMENT_AI_PROVIDER="openai"
```

Variáveis:

```env
DOCUMENT_AI_MODEL="gemini-2.5-flash"
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

Para dados fiscais reais, trate IA como integração externa sensível. Revise:

- `docs/security/external-integrations-security-review.md`
- `docs/tasks/EXEC-AT-114-external-integrations-webhooks-and-ai-security.md`

## Legado SyLembra

O projeto reaproveitou base de outro domínio, SyLembra/licencas/compliance. Esse legado não e o foco atual do AlwaysTrack.

Regra:

- manter compatibilidade quando necessário;
- não usar profissionais, licencas, RT, COREN, vencimento ou regularizacao como backlog ativo;
- manter `ENABLE_LEGACY_SYLEMBRA=false` por default;
- só ativar legado para testes específicos.

## Como Manter Sem Quebrar

Use este mapa:

### Notas/DANFE

Comece por:

```text
services/api/src/core/sales-documents/
apps/web/src/views/notes.tsx
```

Valide:

- dedupe;
- upload;
- extração;
- reprocessamento;
- aprovação/rejeição;
- ranking;
- timeline;
- auditoria.

### Ranking

Comece por:

```text
services/api/src/core/ranking ou sales-documents relacionados
apps/web/src/views/ranking.tsx
```

Cuidados:

- apenas notas aprovadas devem entrar;
- período e campanhas precisam ser explicáveis;
- ranking precisa provar composicao quando contestado.

### Wiki/FAQ

Comece por:

```text
services/api/src/core/wiki/
services/api/src/core/faq/
apps/web/src/views/wiki.tsx
apps/web/src/views/faq.tsx
```

Cuidados:

- slug;
- tenant;
- revisões;
- comentários;
- promoção FAQ -> Wiki;
- notificações;
- tags e busca.

### Avisos

Comece por:

```text
services/api/src/core/announcements/
apps/web/src/views/announcements.tsx
```

Cuidados:

- vigência;
- ciência;
- links profundos;
- notificações;
- status/arquivamento.

### Scriptoteca

Comece por:

```text
services/api/src/core/script-library/
apps/web/src/views/script-library.tsx
```

Cuidados:

- copia em um clique;
- placeholders obrigatórios;
- formatacao por canal;
- scripts pessoais;
- sugestões;
- revisão/validade;
- pacotes/roteiros;
- métricas.

### Fluxos

Comece por:

```text
services/api/src/core/service-flows/
apps/web/src/views/service-flows.tsx
```

Cuidados:

- etapas;
- decisões sim/não/manual;
- sessões auditáveis;
- scripts relacionados;
- métricas;
- governança.

### Usuários/Roles

Comece por:

```text
services/api/src/core/users/
packages/shared/src/
apps/web/src/views/users-teams.tsx
```

Cuidados:

- nunca retornar `passwordHash`;
- preservar vendedor/grupo histórico;
- revisar `requireRole`;
- testar reset de senha e login.

### Banco/Migration

Sempre:

```bash
npm run prisma:generate
npm run db:test:migrations
```

Nunca:

- commitar `dev.db`;
- commitar backup;
- commitar `.env`;
- migrar dados reais sem backup/restore dry-run.

## Onboarding Recomendado

Para entender o projeto do zero:

1. Leia este README.
2. Leia `docs/specs/SPEC-AT-001-product-baseline.md`.
3. Leia `docs/architecture/domains.md`.
4. Leia `docs/architecture/maintenance-map.md`.
5. Rode `npm install`.
6. Rode `npm run setup`.
7. Rode `npm run up`.
8. Abra o app e siga `docs/demo/guided-demo-script.md`.
9. Leia a TypeDoc gerada.
10. Rode `npm run test --workspace @alwaystrack/api`.
11. Rode `npm run typecheck --workspaces --if-present`.
12. Escolha um domínio e leia service + view correspondentes.

## Demonstração Interna

Jornada recomendada para apresentar:

1. Central Operacional Hoje.
2. Nota pendente.
3. Diagnóstico/extração.
4. Revisão e aprovação.
5. Ranking alterado.
6. Ranking explicável.
7. Timeline/auditoria da nota.
8. FAQ com pergunta.
9. Promoção para Wiki.
10. Aviso interno.
11. Scriptoteca e Fluxo de atendimento.
12. Notificações/histórico.
13. Matriz de permissões.
14. Observabilidade/configurações.

Docs:

- `docs/demo/guided-demo-script.md`
- `docs/demo/always-track-demo-checklist.md`

## Deploy e Produção

No estado de referência deste README, o deploy já deve considerar:

1. Postgres gerenciado.
2. S3-compatible privado.
3. Redis gerenciado para BullMQ.
4. HTTPS.
5. Google Login restrito ao domínio.
6. `SESSION_SECRET` forte.
7. `CORS_ORIGIN` exato.
8. `VITE_API_BASE_URL` HTTPS.
9. Backup/PITR configurado.
10. Restore dry-run confirmado.
11. `env:check --production` passando.
12. `db:postgres:preflight` passando.
13. Security/deps/test/e2e passando.

Comandos:

```bash
npm run env:check -- --production
npm run db:postgres:preflight
npm run security:deps
npm run db:test:migrations
npm run test:e2e:api
```

Nota operacional: no repositório, `TASK-AT-149` registra a passagem real para Postgres como dependente de infraestrutura. Este README, por pedido de produto, descreve o ambiente alvo como se essa camada de `.env` e infraestrutura já estivesse decidida. Ao executar de fato, confirme com `npm run db:postgres:preflight`.

## Mapa de API

O registro central de rotas fica em:

```text
services/api/src/app.ts
```

Se uma tela não chama o endpoint esperado, ou se uma permissão parece estranha, comece por esse arquivo. Ele mostra:

- rota;
- metodo HTTP;
- middlewares;
- roles;
- rate limit;
- parser de body;
- handler final.

### Rotas públicas sempre ativas

| Metodo | Rota | Uso | Risco principal |
| --- | --- | --- | --- |
| `GET` | `/health` | healthcheck | revela disponibilidade |
| `POST` | `/v1/auth/login` | login email/senha | brute force |
| `GET` | `/v1/auth/google/status` | informa se Google Login está ativo | baixo |
| `GET` | `/v1/auth/google/start` | inicia OAuth Google | redirect/state |
| `GET` | `/v1/auth/google/callback` | callback OAuth Google | login indevido se mal configurado |
| `GET` | `/v1/integrations/google/oauth/callback` | callback da integração Google/Sheets | state/token |
| `GET` | `/v1/webhooks/meta-whatsapp` | verificacao webhook Meta | verify token |
| `POST` | `/v1/webhooks/meta-whatsapp` | entrada webhook Meta | assinatura/payload |

### Rotas públicas condicionais ao legado

Só devem aparecer quando `ENABLE_LEGACY_SYLEMBRA=true`.

| Metodo | Rota | Uso | Observacao |
| --- | --- | --- | --- |
| `GET` | `/v1/public-upload/:token` | upload público legado | fora do core AlwaysTrack |
| `POST` | `/v1/public-upload/:token` | envio anonimo legado | alto cuidado |
| `GET` | `/v1/public-faq` | FAQ pública legada | evitar em produto comercial |
| `POST` | `/v1/public-help/wa-link` | link WhatsApp legado | evitar exposição sem necessidade |

### Auth e perfil

| Metodo | Rota | Quem usa | O que faz |
| --- | --- | --- | --- |
| `POST` | `/v1/auth/logout` | logado | encerra sessão |
| `GET` | `/v1/auth/me` | logado | retorna usuário atual |
| `GET` | `/v1/profile` | logado | dados do perfil |
| `PATCH` | `/v1/profile` | logado | atualiza perfil |

### Operação executiva

| Metodo | Rota | Quem usa | O que faz |
| --- | --- | --- | --- |
| `GET` | `/v1/operations/today` | roles comerciais | Central Operacional Hoje |
| `GET` | `/v1/search` | roles comerciais | busca global |
| `GET` | `/v1/diagnostics/http-metrics` | Admin | métricas HTTP |
| `GET` | `/v1/diagnostics/operations` | Admin | observabilidade operacional |
| `GET` | `/v1/audit-logs` | Admin | trilha de auditoria |

### Comercial

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/sales/dashboard` | dashboard comercial por filtros |
| `GET` | `/v1/sales/dashboard.csv` | export CSV do dashboard |
| `GET` | `/v1/sales/campaigns` | lista campanhas |
| `POST` | `/v1/sales/campaigns` | cria campanha |
| `PATCH` | `/v1/sales/campaigns/:campaignId` | atualiza campanha |
| `POST` | `/v1/sales/campaigns/:campaignId/snapshots` | gera snapshot |
| `GET` | `/v1/sales/campaigns/:campaignId/snapshots/job` | status do job |
| `GET` | `/v1/sales/ranking` | ranking |
| `GET` | `/v1/sales/ranking/:sellerProfileId/explanation` | composicao auditável |
| `GET` | `/v1/sales/ranking.csv` | export CSV de ranking |
| `GET` | `/v1/sales/sellers` | opções de vendedores |
| `GET` | `/v1/sales/statements` | extratos |
| `GET` | `/v1/sales/statements.csv` | export CSV de extratos |
| `GET` | `/v1/sales/documents` | fila/lista de notas |
| `POST` | `/v1/sales/documents` | upload de DANFE/XML/PDF |
| `GET` | `/v1/sales/documents/:documentId/diagnostics` | diagnóstico de extração |
| `GET` | `/v1/sales/documents/:documentId/timeline` | timeline da nota |
| `PATCH` | `/v1/sales/documents/:documentId/manual-correction` | correção manual auditável |
| `POST` | `/v1/sales/documents/:documentId/analyze` | reprocessamento/IA |
| `PATCH` | `/v1/sales/documents/:documentId/review` | aprova/rejeita/revisa |

### Conhecimento: Wiki e FAQ

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/wiki/pages` | lista Wiki |
| `POST` | `/v1/wiki/pages` | cria página |
| `GET` | `/v1/wiki/pages/by-slug/:slug` | abre Wiki por slug |
| `GET` | `/v1/wiki/pages/:pageId` | detalhe Wiki |
| `PATCH` | `/v1/wiki/pages/:pageId` | edita Wiki |
| `POST` | `/v1/wiki/pages/:pageId/archive` | arquiva |
| `POST` | `/v1/wiki/pages/:pageId/unarchive` | desarquiva |
| `POST` | `/v1/wiki/pages/:pageId/revisions/:revisionId/restore` | restaura revisão |
| `POST` | `/v1/wiki/pages/:pageId/read` | registra leitura |
| `POST` | `/v1/wiki/pages/:pageId/presence` | presenca leitura/edição |
| `POST` | `/v1/wiki/attachments` | upload de imagem Wiki |
| `GET` | `/v1/wiki/attachments/:attachmentId/file` | download autenticado |
| `DELETE` | `/v1/wiki/attachments/:attachmentId` | arquivamento auditável |
| `GET` | `/v1/wiki/edit-requests` | propostas de edição |
| `POST` | `/v1/wiki/edit-requests` | cria proposta |
| `POST` | `/v1/wiki/edit-requests/:requestId/approve` | aprova proposta |
| `POST` | `/v1/wiki/edit-requests/:requestId/reject` | rejeita proposta |
| `GET` | `/v1/faq/threads` | lista threads |
| `POST` | `/v1/faq/threads` | cria pergunta |
| `POST` | `/v1/faq/threads/:threadId/comments` | comenta |
| `PATCH` | `/v1/faq/threads/:threadId/status` | muda status |
| `POST` | `/v1/faq/threads/:threadId/reactions` | reage |
| `POST` | `/v1/faq/threads/:threadId/promote-to-wiki` | promove para Wiki |

### Avisos

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/announcements` | lista avisos |
| `POST` | `/v1/announcements` | cria aviso |
| `GET` | `/v1/announcements/by-slug/:slug` | abre por slug |
| `PATCH` | `/v1/announcements/:announcementId` | edita aviso |
| `POST` | `/v1/announcements/:announcementId/publish` | pública |
| `POST` | `/v1/announcements/:announcementId/archive` | arquiva |
| `POST` | `/v1/announcements/:announcementId/acknowledge` | registra ciência |

### Scriptoteca

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/script-library` | lista categorias/scripts/pacotes/métricas |
| `GET` | `/v1/script-library/personal-scripts` | scripts pessoais |
| `POST` | `/v1/script-library/personal-scripts` | cria script pessoal |
| `POST` | `/v1/script-library/personal-scripts/:personalScriptId/suggest` | sugere ao admin |
| `POST` | `/v1/script-library/categories` | cria categoria |
| `POST` | `/v1/script-library/packs` | cria pacote/roteiro |
| `PATCH` | `/v1/script-library/packs/:packId` | edita/reordena pacote |
| `POST` | `/v1/script-library/suggestions` | cria sugestão |
| `POST` | `/v1/script-library/suggestions/:suggestionId/decision` | decide sugestão |
| `POST` | `/v1/script-library/scripts` | cria script canônico |
| `PATCH` | `/v1/script-library/scripts/:scriptId` | edita script |
| `POST` | `/v1/script-library/scripts/:scriptId/validate` | valida |
| `POST` | `/v1/script-library/scripts/:scriptId/obsolete` | obsoleta |
| `POST` | `/v1/script-library/scripts/:scriptId/recertify` | recertifica |
| `POST` | `/v1/script-library/scripts/:scriptId/revisions/:revisionId/restore` | restaura revisão |
| `POST` | `/v1/script-library/scripts/:scriptId/copy` | registra copia |

### Fluxos de atendimento

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/service-flows` | lista fluxos |
| `GET` | `/v1/service-flows/metrics/summary` | métricas |
| `GET` | `/v1/service-flows/:flowIdOrSlug` | detalhe por id/slug |
| `POST` | `/v1/service-flows` | cria fluxo |
| `PATCH` | `/v1/service-flows/:flowId` | edita fluxo |
| `POST` | `/v1/service-flows/:flowId/publish` | pública |
| `POST` | `/v1/service-flows/:flowId/archive` | arquiva |
| `POST` | `/v1/service-flows/:flowIdOrSlug/sessions` | inicia atendimento |
| `GET` | `/v1/service-flow-sessions/:sessionId` | detalhe da sessão |
| `POST` | `/v1/service-flow-sessions/:sessionId/steps/:stepId` | atualiza etapa |
| `POST` | `/v1/service-flow-sessions/:sessionId/complete` | finaliza sessão |

### Anexos operacionais

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `POST` | `/v1/attachments/operational` | upload de imagem de Avisos/FAQ/Fluxos/Scriptoteca |
| `GET` | `/v1/attachments/operational/:attachmentId/file` | download autenticado |
| `DELETE` | `/v1/attachments/operational/:attachmentId` | arquiva anexo |

### Admin

| Metodo | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/v1/organization` | organização |
| `PATCH` | `/v1/organization` | atualiza organização |
| `GET` | `/v1/organization/settings` | configurações |
| `PATCH` | `/v1/organization/settings` | atualiza configurações |
| `POST` | `/v1/organization/units` | cria unidade legada |
| `PATCH` | `/v1/organization/units/:unitId` | edita unidade |
| `POST` | `/v1/organization/units/:unitId/sectors` | cria setor |
| `PATCH` | `/v1/organization/sectors/:sectorId` | edita setor |
| `GET` | `/v1/users` | lista usuários |
| `GET` | `/v1/users/commercial-options` | opções para vínculos comerciais |
| `POST` | `/v1/users` | cria usuário |
| `PATCH` | `/v1/users/:userId` | edita usuário |
| `POST` | `/v1/users/:userId/reset-password` | reset de senha |
| `GET` | `/v1/integrations/google/status` | status integração Sheets/Drive |
| `GET` | `/v1/integrations/google/oauth/start` | inicia OAuth integração |
| `DELETE` | `/v1/integrations/google` | desconecta integração |

## Ciclos de Vida das Entidades

### SalesDocument

Estados tipicos:

```text
UPLOADED -> PENDING_REVIEW -> APPROVED
                         -> REJECTED
                         -> DUPLICATE
                         -> NEEDS_CORRECTION
```

Eventos esperados:

1. upload salva arquivo em storage;
2. extração determinística tenta preencher campos;
3. IA pode complementar;
4. revisor decide;
5. decisão registra comentário;
6. ranking/extrato consideram apenas aprovadas;
7. timeline agrega eventos do documento, extração e auditoria.

Quebras comuns:

- arquivo não bate com MIME;
- PDF sem texto não extrai;
- chave de acesso ausente;
- nota marcada duplicada por chave real;
- vendedor errado;
- período/campanha fora do filtro;
- reprocessamento sem output por provider IA/env.

### WikiPage

Estados praticos:

```text
active=true  -> publicada
active=false -> arquivada
```

Governança:

- Admin cria/pública;
- usuários contribuem via `WikiEditRequest`;
- aprovação/rejeição pode ter comentário;
- revisões preservam histórico;
- slug publicado deve abrir por `/wiki/:slug` no frontend;
- leitura/presenca podem ser registradas.

### FaqThread

Estados praticos:

```text
OPEN -> ANSWERED -> RESOLVED
                 -> PROMOTED_TO_WIKI
```

Governança:

- qualquer role comercial pode perguntar/comentar/reagir;
- roles superiores moderam status;
- promoção gera Wiki, mas não apaga a FAQ;
- backlink preserva origem.

### Announcement

Estados praticos:

```text
DRAFT -> PUBLISHED -> ARCHIVED
```

Regras:

- pode ter vigência;
- pode exigir ciência;
- pode ter links profundos;
- pode aparecer na Central Hoje;
- pode gerar notificações.

### OperationalScript

Estados praticos:

```text
DRAFT -> VALIDATED -> NEEDS_REVIEW
                  -> OBSOLETE
```

Governança:

- scripts tem canal;
- scripts podem ter placeholders;
- scripts podem ter validade/recertificacao;
- cada copia incrementa métrica;
- sugestões podem virar canon;
- revisões podem ser restauradas por Admin.

### PersonalScript

Uso:

- pertence a um usuário;
- pode estar ligado a zero, um ou varios fluxos;
- e privado;
- pode ser sugerido para virar script canônico.

### ServiceFlow

Estados praticos:

```text
DRAFT -> PUBLISHED -> ARCHIVED
```

Execução:

- fluxo tem etapas;
- etapa pode ser manual, checklist ou decisão;
- sessão registra atendimento real;
- etapas podem ter scripts relacionados;
- métricas mostram uso.

### OperationalAttachment

Uso:

- imagens de Avisos, FAQ, Fluxos e Scriptoteca;
- separado de `WikiAttachment` para não misturar semântica;
- download autenticado;
- arquivamento preserva storage e auditoria.

Superficies:

- `announcement`
- `faq`
- `service-flow`
- `script-library`
- `profile`
- `settings`

## Fluxo de Dados Ponta a Ponta

### Upload de DANFE

```text
Browser
  -> NotesView
  -> POST /v1/sales/documents
  -> requireAuth + requireRole
  -> express.raw
  -> uploadSalesDocument
  -> validateAllowedFile
  -> StorageProvider.put
  -> Prisma.SalesDocument
  -> extracao deterministica
  -> possivel IA
  -> AuditLog
  -> InAppNotification
```

Se quebrar, confira nesta ordem:

1. request no navegador;
2. rota em `app.ts`;
3. role do usuário;
4. MIME/body;
5. storage provider;
6. registro `SalesDocument`;
7. logs/auditoria;
8. extração;
9. notificação.

### Aprovação de nota

```text
NotesView
  -> PATCH /v1/sales/documents/:documentId/review
  -> getScopedSalesDocument
  -> reviewSalesDocument
  -> SalesItem/SalesDocument update
  -> AuditLog
  -> timeline
  -> dashboard/ranking/extrato
```

Se o ranking não mexer:

- confirme `status=APPROVED`;
- confirme período;
- confirme vendedor;
- confirme campaign;
- confirme se item aprovado tem valor/quantidade;
- confira endpoint de ranking com os mesmos filtros.

### Promoção FAQ para Wiki

```text
FaqView
  -> POST /v1/faq/threads/:threadId/promote-to-wiki
  -> faq.service
  -> wiki.service/create page
  -> FaqThread recebe wikiPageId/backlink
  -> AuditLog
  -> Notification
```

Se o link quebrar:

- conferir slug;
- conferir página ativa;
- conferir permissão;
- conferir route frontend `/wiki/:slug`;
- conferir se FAQ preservou referência.

### Copia de script

```text
ScriptLibraryView
  -> preenche placeholders
  -> limpa/formatta por canal
  -> POST /v1/script-library/scripts/:scriptId/copy
  -> incrementa usageCount/copy event
  -> copia para clipboard no browser
```

Se copiar texto incompleto:

- conferir placeholders obrigatórios;
- conferir valores no state da UI;
- conferir formatacao por canal;
- conferir se Markdown está sendo removido quando necessário.

## Env: Onde Pegar Cada Coisa

Está seção é para o "estado seguinte" do projeto. Não cole valores reais em chat externo; use este mapa para saber onde buscar.

### Google Login

Variáveis:

```env
GOOGLE_LOGIN_CLIENT_ID=""
GOOGLE_LOGIN_CLIENT_SECRET=""
GOOGLE_LOGIN_REDIRECT_URI=""
GOOGLE_LOGIN_ALLOWED_DOMAINS="alwaysfit.com.br"
```

Onde pegar:

1. Google Cloud Console.
2. APIs & Services.
3. Credentials.
4. Create credentials.
5. OAuth client ID.
6. Application type: Web application.
7. Authorized redirect URIs.

Redirects:

```text
Local:    http://localhost:3333/v1/auth/google/callback
Prod:     https://SEU_DOMINIO/v1/auth/google/callback
```

Cuidados:

- redirect precisa ser exatamente igual;
- domínio permitido no app e `alwaysfit.com.br`;
- OAuth client de login é diferente de service account;
- se usar o mesmo OAuth client da integração Google, confira os redirects de ambos.

### Google Sheets/Drive

Variáveis de OAuth usuário/admin:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI=""
GOOGLE_TOKEN_ENCRYPTION_KEY=""
```

Variáveis de service account:

```env
GOOGLE_APPLICATION_CREDENTIALS=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_PRIVATE_KEY=""
GOOGLE_SHEETS_TEMPLATE_FOLDER_ID=""
GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL=""
GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE="writer"
```

Onde pegar:

- OAuth: Google Cloud Console > APIs & Services > Credentials > OAuth client.
- Service account: IAM & Admin > Service Accounts > Keys > JSON.
- Folder ID: URL da pasta no Google Drive.
- Share email: email com quem o template/arquivo deve ser compartilhado.

Decisão prática:

- Se `GOOGLE_APPLICATION_CREDENTIALS` aponta para um JSON local/secret montado, talvez não precise preencher `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY`.
- Se não usar arquivo JSON, preencha email/private key do JSON via env.

### Gemini/OpenAI

Gemini:

```env
DOCUMENT_AI_PROVIDER="gemini"
DOCUMENT_AI_MODEL="gemini-2.5-flash"
GEMINI_API_KEY=""
```

OpenAI:

```env
DOCUMENT_AI_PROVIDER="openai"
OPENAI_API_KEY=""
```

Cuidados:

- DANFEs podem conter dados fiscais/comerciais;
- não envie dados reais para provider externo sem decisão de segurança;
- mantenha fallback determinístico funcionando.

### Meta WhatsApp

Variáveis:

```env
NOTIFICATION_PROVIDER="meta"
META_WHATSAPP_TOKEN=""
META_WHATSAPP_PHONE_NUMBER_ID=""
META_WEBHOOK_VERIFY_TOKEN=""
META_APP_SECRET=""
META_WHATSAPP_SMOKE_TO=""
META_WHATSAPP_SMOKE_TEMPLATE="hello_world"
META_WHATSAPP_SMOKE_TEMPLATE_LANGUAGE="en_US"
SUPPORT_PHONE=""
```

Onde pegar:

- Meta for Developers;
- WhatsApp Business;
- app secret;
- token;
- phone number id;
- webhook verify token definido por você.

Cuidados:

- webhook POST deve validar assinatura;
- smoke deve usar número de teste/autorizado;
- não logar token.

### Postgres

Variáveis:

```env
DATABASE_URL="postgresql://..."
POSTGRES_DATABASE_URL="postgresql://..."
POSTGRES_BACKUP_CONFIRMED="true"
POSTGRES_RESTORE_DRY_RUN_CONFIRMED="true"
```

Onde pegar:

- Neon;
- Supabase;
- Railway;
- Render;
- AWS RDS;
- Google Cloud SQL;
- outro Postgres gerenciado.

Cuidados:

- não usar SQLite em produção real;
- não setar flags de backup/restore como true sem evidência;
- rodar `npm run db:postgres:preflight`;
- migração real deve ser feita em branch própria.

### S3-compatible storage

Variáveis:

```env
STORAGE_PROVIDER="s3"
STORAGE_S3_ENDPOINT=""
STORAGE_S3_BUCKET=""
STORAGE_S3_REGION="us-east-1"
STORAGE_S3_ACCESS_KEY_ID=""
STORAGE_S3_SECRET_ACCESS_KEY=""
STORAGE_S3_FORCE_PATH_STYLE="true"
```

Onde pegar:

- AWS S3;
- Cloudflare R2;
- MinIO;
- DigitalOcean Spaces;
- Backblaze B2 S3-compatible.

Cuidados:

- bucket privado;
- sem acesso público direto;
- API continua autenticando download;
- configurar lifecycle/backup conforme política interna.

### Redis/BullMQ

Variáveis:

```env
JOB_QUEUE_DRIVER="bullmq"
REDIS_URL="redis://..."
JOB_CONCURRENCY="2"
```

Onde pegar:

- Upstash;
- Redis Cloud;
- Railway;
- Render;
- outro Redis gerenciado.

Local sem Redis:

```env
JOB_QUEUE_DRIVER="inline"
JOB_CONCURRENCY="2"
```

## Árvore de Debug

### "Não consigo logar"

1. Veja se `GET /v1/auth/me` retorna 401 ou usuário.
2. Confira `SESSION_SECRET`.
3. Confira cookie no navegador.
4. Confira `CORS_ORIGIN`.
5. Confira usuário `active`.
6. Confira senha/reset.
7. Para Google:
   - `GOOGLE_LOGIN_CLIENT_ID`;
   - `GOOGLE_LOGIN_CLIENT_SECRET`;
   - `GOOGLE_LOGIN_REDIRECT_URI`;
   - redirect autorizado no Google Cloud;
   - domínio do email;
   - `GOOGLE_LOGIN_ALLOWED_DOMAINS`.

### "Access denied"

1. Abra `services/api/src/app.ts`.
2. Ache a rota.
3. Veja `requireRole`.
4. Confira role em `User.role`.
5. Confira `packages/shared/src`.
6. Se recurso e por vendedor/grupo, confira escopo no service.

### "Nota subiu mas não apareceu"

1. Veja response do upload.
2. Confira `SalesDocument`.
3. Confira `sellerProfileId`.
4. Confira `status`.
5. Confira `createdAt/uploadedAt`.
6. Confira filtro da tela.
7. Confira página atual.

### "Nota duplicou sem motivo"

1. Confira `accessKey`.
2. Compare `organizationId + accessKey`.
3. Veja diagnóstico.
4. Veja reprocessamento.
5. Confira se pacote DANFE tinha notas repetidas.
6. Confira se extração criou item sem chave.

### "IA não retornou nada"

1. Confira `DOCUMENT_AI_PROVIDER`.
2. Confira API key do provider.
3. Confira logs de diagnóstico.
4. Teste XML conhecido.
5. Veja se fallback determinístico extraiu algo.
6. Confira se erro foi registrado como falha observável.

### "Ranking está errado"

1. O vendedor tem `SellerProfile` ativo?
2. Existem notas `APPROVED`?
3. Período bate?
4. Campanha bate?
5. Itens aprovados tem valor?
6. Ranking explanation mostra a nota?
7. Extrato usa mesmo range?

### "Wiki por slug não abre"

1. Confira `slug`.
2. Confira `active=true`.
3. Confira `GET /v1/wiki/pages/by-slug/:slug`.
4. Confira rota frontend.
5. Confira permissão.
6. Confira se página foi arquivada.

### "Imagem no editor não aparece"

1. Wiki usa `/v1/wiki/attachments`.
2. Avisos/FAQ/Fluxos/Scriptoteca usam `/v1/attachments/operational`.
3. Confira `markdownUrl`.
4. Confira auth no download.
5. Confira `archivedAt`.
6. Confira storage provider.
7. Confira MIME real.

### "Script copiado ficou estranho"

1. Confira canal.
2. Confira placeholders obrigatórios.
3. Confira aviso de Markdown removido.
4. Confira se state foi preenchido.
5. Confira script canônico vs pessoal.
6. Confira pacote/roteiro selecionado.

### "Aviso não apareceu"

1. Status e `PUBLISHED`?
2. Vigência comeca no futuro?
3. Expirou?
4. Role alvo inclui usuário?
5. Foi arquivado?
6. Central Hoje está filtrando corretamente?

### "npm run up não abriu algo"

1. Confira `scripts/start-all.js`.
2. Confira se a porta já estava em uso.
3. Confira se o report existe antes de tentar abrir.
4. Rode o script específico do report.
5. Confira logs do terminal.

## Playbooks de Mudança

### Adicionar nova tela

1. Criar view em `apps/web/src/views`.
2. Ligar no layout/router existente.
3. Adicionar item de navegacao se fizer sentido.
4. Criar endpoint API se houver dado novo.
5. Definir roles no `app.ts`.
6. Criar service no domínio correto.
7. Adicionar teste do service.
8. Atualizar docs/README se for domínio relevante.

### Adicionar novo campo no banco

1. Editar `schema.prisma`.
2. Criar migration.
3. Rodar `npm run prisma:generate`.
4. Rodar `npm run db:test:migrations`.
5. Ajustar seed se necessário.
6. Ajustar service.
7. Ajustar UI.
8. Ajustar testes.
9. Documentar risco de dados antigos.

### Adicionar nova action auditável

1. Definir nome de action consistente.
2. Chamar `recordAuditLog`.
3. Incluir `organizationId`, `actorId`, `entityType`, `entityId`.
4. Metadata deve ser útil, mas sem secrets.
5. Se impactar usuário, avaliar notificação.
6. Se aparecer na timeline, ajustar agregador.

### Adicionar integração externa

1. Criar envs no `.env.example`.
2. Atualizar `scripts/check-env.js`.
3. Usar timeout via helper externo quando aplicável.
4. Redigir logs sem payload sensível.
5. Criar smoke separado.
6. Documentar onde pegar credenciais.
7. Adicionar task/runbook se for sensível.

### Adicionar upload novo

1. Não confiar no `content-type`.
2. Validar magic bytes.
3. Definir limite por tipo.
4. Definir surface/entidade.
5. Salvar via `StorageProvider`.
6. Registrar auditoria.
7. Garantir download autenticado.
8. Testar anti-IDOR.

### Adicionar role/permissão

1. Começar em `packages/shared`.
2. Atualizar matriz de permissão.
3. Atualizar `requireRole` nas rotas.
4. Atualizar UI condicional.
5. Testar role nova e role negada.
6. Cuidar de dados históricos.

## Leitura Guiada do Código

### Camada 1: contrato mental

Leia:

```text
docs/specs/SPEC-AT-001-product-baseline.md
docs/architecture/domains.md
docs/tasks/ROADMAP.md
```

Objetivo:

- entender por que o produto existe;
- separar AlwaysTrack atual do legado SyLembra;
- saber o que já foi feito.

### Camada 2: contratos compartilhados

Leia:

```text
packages/shared/src/index.ts
```

Objetivo:

- roles;
- tipos comuns;
- constantes compartilhadas.

### Camada 3: entrada HTTP

Leia:

```text
services/api/src/app.ts
services/api/src/core/auth/auth.middleware.ts
services/api/src/core/http/
```

Objetivo:

- descobrir quem pode chamar o que;
- entender rate limits;
- entender CORS/security/origin.

### Camada 4: domínio

Escolha um domínio e leia service antes da UI:

```text
services/api/src/core/sales-documents/sales-documents.service.ts
services/api/src/core/wiki/wiki.service.ts
services/api/src/core/faq/faq.service.ts
services/api/src/core/script-library/script-library.service.ts
services/api/src/core/service-flows/service-flows.service.ts
```

Objetivo:

- regra real;
- filtro por organização;
- transições de status;
- auditoria;
- notificações.

### Camada 5: UI

Leia a view correspondente:

```text
apps/web/src/views/
```

Objetivo:

- filtros;
- estados;
- chamadas de API;
- layout;
- interacoes.

### Camada 6: testes e docs

Leia:

```text
services/api/src/**/*.test.ts
docs/tasks/EXEC-AT-*.md
docs/architecture/testing-and-docs.md
```

Objetivo:

- entender o que está protegido;
- entender decisões antigas;
- saber onde ampliar cobertura.

## Estrutura dos Docs

```text
docs/
  adr/             Decisoes arquiteturais
  architecture/    Mapas tecnicos e onboarding
  demo/            Roteiro de apresentacao
  operations/      Runbooks e operacao
  performance/     Artillery, observabilidade e carga
  pipeline/        Processo dos agentes/tasks
  project/         Intake e contexto de produto
  runbooks/        Runbooks numerados
  security/        Threat model, gates e seguranca
  specs/           Especificacoes de produto
  tasks/           Backlog, tasks e execucoes
```

Quando atualizar:

- mudou arquitetura: `docs/architecture`;
- mudou deploy/ambiente: `docs/operations`;
- mudou segurança: `docs/security`;
- mudou fluxo demonstravel: `docs/demo`;
- mudou backlog: `docs/tasks/ROADMAP.md`;
- executou task formal: criar/atualizar `EXEC-AT-...`.

## Glossario de Arquivos

Arquivos que normalmente resolvem 80% das dúvidas:

```text
services/api/src/app.ts
services/api/prisma/schema.prisma
services/api/src/config/env.ts
services/api/src/core/auth/auth.service.ts
services/api/src/core/auth/google-login.service.ts
services/api/src/core/sales-documents/sales-documents.service.ts
services/api/src/core/wiki/wiki.service.ts
services/api/src/core/faq/faq.service.ts
services/api/src/core/announcements/announcements.service.ts
services/api/src/core/script-library/script-library.service.ts
services/api/src/core/service-flows/service-flows.service.ts
services/api/src/core/notifications/notifications.service.ts
services/api/src/core/audit/audit.service.ts
services/api/src/core/documents/storage.ts
services/api/src/core/attachments/operational-attachments.service.ts
apps/web/src/api.ts
apps/web/src/views/notes.tsx
apps/web/src/views/ranking.tsx
apps/web/src/views/wiki.tsx
apps/web/src/views/faq.tsx
apps/web/src/views/script-library.tsx
apps/web/src/views/service-flows.tsx
packages/shared/src/index.ts
```

## Definições de Pronto

### Feature pequena

- typecheck API/Web passando conforme área;
- teste de service se tiver regra;
- UI sem overflow obvio;
- auditoria se ação sensível;
- docs se muda fluxo de produto;
- sem secrets/logs sensíveis.

### Feature de domínio

- migration se precisa;
- testes de service;
- teste de permissão/tenant quando ha risco;
- UI integrada;
- rota com `requireRole`;
- docs atualizados;
- roadmap/task atualizado.

### Feature de segurança

- threat model ou doc relacionado atualizado;
- env guard quando envolve secret;
- teste negativo;
- validação de origem/role/tenant;
- logs sem segredo;
- rollback claro.

### Pronto para apresentar

- seed/demo coerente;
- Central Hoje mostra ação real;
- notas/ranking/wiki/faq/scriptoteca tem dados;
- estados vazios bonitos;
- nenhum texto estourando;
- demo script praticável ponta a ponta.

### Pronto para produção real

- Postgres gerenciado;
- S3-compatible privado;
- Redis se jobs reais;
- HTTPS;
- Google Login restrito;
- backup/PITR;
- restore dry-run;
- env production validado;
- preflight Postgres passando;
- security gate aprovado;
- carga mínima validada;
- incidente/rollback documentados.

## Anti-Padrões

Evite:

- criar regra de permissão só no frontend;
- colocar dado sensível em log;
- salvar arquivo fora do `StorageProvider`;
- adicionar upload sem magic byte validation;
- criar status novo sem documentar;
- misturar Wiki attachment com operational attachment;
- mexer em schema sem migration;
- mexer em ranking sem explicar composicao;
- fazer refactor amplo sem teste;
- ativar legado SyLembra sem motivo;
- marcar Postgres como pronto sem banco real;
- copiar valores de `.env` para chat externo.

## Decisões Arquiteturais

ADRs:

- `ADR-001`: governança documental operacional.
- `ADR-002`: fronteira de template AlwaysTrack.
- `ADR-003`: contrato de banco de produção.
- `ADR-004`: contrato de storage de produção.
- `ADR-005`: filas BullMQ e backpressure.

Diretrizes:

- local-first para desenvolvimento;
- Postgres para produção real;
- storage externo para arquivos sensíveis;
- API como fonte de verdade;
- UI não substitui autorização;
- auditoria em ação sensível;
- docs e testes acompanham mudanças de domínio;
- evitar refactor amplo sem ganho claro.

## Glossario Rápido

- DANFE: documento auxiliar da nota fiscal eletrônica.
- Nota aprovada: nota que pode impactar ranking/extrato.
- Nota rejeitada: nota com motivo/comentário sem impacto no ranking.
- Ranking explicável: ranking com composicao auditável.
- Timeline da nota: histórico visual de eventos da DANFE.
- Wiki: conhecimento validado e versionado.
- FAQ: dúvida/thread colaborativa.
- Promoção FAQ -> Wiki: ação que transforma uma dúvida resolvida em página validada.
- Aviso: comunicado interno com vigência, links e ciência.
- Scriptoteca: biblioteca de textos prontos do SAC.
- Script pessoal: script privado de um atendente, opcionalmente ligado a fluxos.
- Fluxo: atendimento guiado com etapas, decisões e scripts.
- Attachment operacional: imagem/anexo de Avisos, FAQ, Fluxos e Scriptoteca.
- Wiki attachment: imagem/anexo próprio da Wiki, mantido separado por compatibilidade.
- Preflight: script que bloqueia falsa prontidão antes de produção.

## Checklist de Saúde

Antes de considerar uma entrega saudável:

```bash
git status --short
npm run typecheck --workspaces --if-present
npm run test --workspaces --if-present
npm run db:test:migrations
npm run env:check
git diff --check
```

Antes de produção:

```bash
npm run env:check -- --production
npm run db:postgres:preflight
npm run security:deps
npm run test:e2e:api
```

## Status Final deste README

Este README descreve o AlwaysTrack como produto interno consolidado no estado alvo de ambiente preenchido:

- produto interno comercial/operacional;
- base funcional ampla;
- backlog funcional quase limpo;
- env completo para Google Login, Postgres, S3-compatible storage, Redis/BullMQ, IA e integrações;
- local-first preservado para desenvolvimento;
- preflight e runbooks como guardas antes de dados reais;
- pronto para uma fase focada em operação com dados reais, observabilidade real e refinamento de apresentacao.
