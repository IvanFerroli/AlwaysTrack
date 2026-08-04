# AlwaysTrack

Plataforma interna da Always Fit para operação comercial, atendimento e conhecimento. O sistema concentra notas fiscais, revisão financeira, ranking e campanhas, Wiki/FAQ, avisos, Scriptoteca, escalas do SAC e o fluxo guiado do CaseFlow.

O repositório é um monorepo TypeScript com seis workspaces. O caminho principal é determinístico e auditável; integrações externas, IA e automações locais são complementares e devem degradar sem bloquear a operação central.

## Estado atual

- A demo local/offline está disponível com SQLite, storage local, dados sintéticos e providers fake.
- API, Web, contratos compartilhados, SmartScript, Companion Host e extensão MV3 possuem build e testes locais.
- O CaseFlow persiste casos e evidências, resolve conflitos, aplica heurísticas e compila fluxos guiados.
- O Companion opera separado do Core: shell MV3, Host e protocolo local estão implementados, mas o wiring de captura em páginas reais ainda está pendente. Cookies e senhas externas não são persistidos.
- PostgreSQL, storage S3, Redis/BullMQ e integrações reais ainda exigem validação em ambiente production-like/live.
- Rollout interno do Companion e exposição pública continuam `NO-GO`; o estado detalhado está no [ledger de prontidão](docs/operations/project-readiness-ledger.md).

## Arquitetura

```text
AlwaysTrack/
├── apps/
│   ├── web/                    React 19 + Vite
│   ├── companion-extension/    extensão Chromium Manifest V3
│   └── smartscript-companion/  CLI local de captura/importação/exportação
├── services/
│   ├── api/                    Express 5 + Prisma
│   └── companion-host/         processo local e protocolo WebSocket
├── packages/
│   └── shared/                 tipos, permissões e contratos
├── scripts/                    setup, workbench, checks e relatórios
├── tests/                      Playwright, startup, documentação e carga
└── docs/                       arquitetura, ADRs, runbooks e evidências
```

### Fronteiras principais

- `apps/web/src/views`: telas por domínio; o cliente HTTP central fica em `apps/web/src/api.ts`.
- `services/api/src/app.ts`: composição HTTP, middlewares, autenticação, rate limits e rotas.
- `services/api/src/core`: regras de negócio por domínio; handlers não devem concentrar regra.
- `services/api/prisma/schema.prisma`: modelo de dados canônico; migrations ficam em `services/api/prisma/migrations`.
- `packages/shared/src`: contratos consumidos por API, Web, extensão e Host.
- `services/api/src/core/case-flow`: casos, fatos, conflitos, heurística, planos e action firewall.
- `apps/companion-extension` e `services/companion-host`: navegação local isolada do Core.

Todos os acessos de negócio devem respeitar `organizationId`, role e escopo do usuário. Senhas, cookies de terceiros, HTML bruto e tokens de providers externos não entram em logs ou auditoria; credenciais efêmeras de pairing/reconexão trafegam apenas no protocolo local.

## Stack e runtime

- Node.js 22 e npm workspaces.
- TypeScript 5.9.
- React 19 + Vite 7 no frontend.
- Express 5 + Prisma 6 na API.
- SQLite e storage privado local para desenvolvimento/demo.
- PostgreSQL, S3-compatible e Redis/BullMQ como alvos operacionais, ainda sujeitos aos gates de prontidão.
- Vitest para testes de workspace, Playwright para E2E e Artillery para carga.

## Onboarding local

### Pré-requisitos

- Node.js 22 e npm.
- Um navegador instalado para abrir a bancada local.
- Chromium/Playwright somente para `npm run up:full` e validações E2E.
- Redis somente para testar o driver BullMQ.
- Chrome Stable e perfil exclusivo apenas para validação manual do Companion.

### Primeira execução — `main` recém-baixada

```bash
npm run up
```

Esse único comando instala as dependências pelo lockfile quando necessário, gera o Prisma Client, cria/alinha o SQLite, aplica o seed, sobe API, Web, Prisma Studio e Hub e abre o Hub no navegador. O `.env` é opcional: sem ele, os mesmos defaults locais seguros são aplicados. Se um `.env` pré-configurado foi fornecido separadamente, coloque-o na raiz antes de executar o comando e transporte-o somente por um canal privado.

Credenciais fake determinísticas da demo:

- `admin@example.com` — administrador;
- `sac@example.com`, `sac2@example.com`, `sac3@example.com` — atendimento;
- `financeiro@example.com` — financeiro;
- `vendedor@example.com` — vendedor;
- `supervisor@example.com` — supervisor.

Todos usam `AlwaysTrackDev123!` no ambiente local padrão. Um `.env` pré-configurado pode substituir a senha pelas variáveis `SEED_*_PASSWORD`.

O banco armazena somente hashes de senha. Se uma senha for perdida, defina um novo valor e rode o seed/reset local; não tente extrair o hash. `SEED_RT_PASSWORD` existe apenas para o legado SyLembra quando `ENABLE_LEGACY_SYLEMBRA=true`.

### Subir a bancada completa

```bash
npm run up
```

Por padrão, o comando prepara banco e documentação, sobe API, Web, Prisma Studio e Hub, inicializa o SmartScript e prepara a integração opcional com Espanso. Coverage, E2E e carga ficam fora do caminho de demonstração para reduzir tempo e dependências do sistema.

Para também regenerar todas as evidências técnicas e abrir cada superfície em uma aba:

```bash
npm run up:full
```

Use `npm run up -- --no-open` em ambientes sem interface gráfica e `npm run up -- --no-smartscript` quando não quiser preparar SmartScript/Espanso.

Superfícies locais:

- Web: `http://localhost:5173`
- API/readiness: `http://localhost:3333/health/ready`
- Hub técnico: `http://localhost:4173`
- Prisma Studio: `http://localhost:5555`
- Companion Host, quando iniciado separadamente: `http://127.0.0.1:38472/health`

### Desenvolvimento em terminais separados

```bash
npm run dev:api
npm run dev:web
```

O root `npm run dev` sobe somente a API. Use `Ctrl+C` no terminal de `npm run up` para encerrar os processos iniciados por aquela sessão.

O Companion Host não faz parte do `npm run up`. Para uma validação local explícita:

```bash
npm run companion:host:build
COMPANION_HOST_ALLOWED_ORIGIN="chrome-extension://<id-de-32-caracteres>" npm run companion:host:start
```

## Configuração

Use `.env.example` como base local; os scripts e runbooks específicos são a fonte para opções avançadas de beta, Companion, CaseFlow e rate limits. Nunca versione `.env`, bancos locais ou credenciais reais. Os grupos mais relevantes são:

- Core: `DATABASE_URL`, `SESSION_SECRET`, `API_PORT`, `CORS_ORIGIN`.
- Web: `VITE_API_BASE_URL`, `VITE_APP_NAME`.
- Storage: `STORAGE_PROVIDER`, `STORAGE_LOCAL_DIR` e `STORAGE_S3_*`.
- Filas: `JOB_QUEUE_DRIVER`, `REDIS_URL`, `JOB_CONCURRENCY`.
- Login Google: `GOOGLE_LOGIN_*` e allowlist de domínio.
- IA de documentos: `DOCUMENT_AI_PROVIDER` e a chave do provider escolhido.
- Notificações/Google Sheets: variáveis `META_*` e `GOOGLE_*`.

Valide o ambiente antes de usar uma configuração compartilhada:

```bash
npm run env:check
npm run env:check:beta
npm run env:check -- --production
```

Produção rejeita SQLite, segredo de sessão fraco, origem HTTP pública e configuração parcial de providers. Consulte o [gate de exposição externa](docs/security/external-exposure-release-gate.md) antes de qualquer publicação.

## Scripts principais

### Desenvolvimento e build

| Comando | Uso |
| --- | --- |
| `npm run setup` | prepara banco, seed e artefatos sem manter os serviços ativos |
| `npm run up` | instala o necessário e sobe a bancada local integrada |
| `npm run up:full` | sobe a bancada e regenera coverage, E2E e carga |
| `npm run dev:api` / `npm run dev:web` | desenvolvimento isolado de API e Web |
| `npm run build` | build dos seis workspaces |
| `npm run caseflow:typecheck` | contratos, Host e extensão do CaseFlow |
| `npm run companion:host:build` | compila o Host local |
| `npm run companion:extension:build` | gera e valida a extensão MV3 |

### Qualidade

| Comando | Uso |
| --- | --- |
| `npm run check` | lint, typecheck, testes, startup, planos de performance e build |
| `npm run check:docs` | integridade documental e TypeDoc |
| `npm run test:unit` | testes rápidos da API |
| `npm run test:integration` | fluxo integrado principal |
| `npm run test:regression` | notas, Wiki, FAQ e notificações |
| `npm run test:e2e:smoke` | smoke desktop Playwright |
| `npm run test:e2e` | suíte browser/API completa |
| `npm run coverage:html` | coverage dos seis workspaces e manifesto agregado |
| `npm run repo:hygiene` | segredos, artefatos locais, licenças e higiene do repositório |
| `npm run security:ci` | auditoria de dependências, licenças e higiene |

### Banco, jobs e operação

| Comando | Uso |
| --- | --- |
| `npm run prisma:generate` | gera o Prisma Client |
| `npm run prisma:migrate` | cria/aplica migration de desenvolvimento |
| `npm run prisma:seed` | aplica o seed com as variáveis `SEED_*` |
| `npm run db:test:migrations` | valida migrations em banco isolado |
| `npm run db:postgres:preflight` | audita pré-condições para Postgres |
| `npm run demo:reset:local` | recria o estado sintético da demo local |
| `npm run job:announcement-scheduler` | materializa avisos recorrentes |
| `npm run job:support-schedule-horizon` | materializa horizonte de escalas |
| `npm run job:ranking-snapshots` | gera snapshots de ranking |
| `npm run test:jobs:redis` | valida jobs com BullMQ/Redis |

`db:flush:local`, `db:flush:demo` e `demo:reset:local` alteram dados do SQLite local. Confirme `DATABASE_URL` antes de executá-los.

## Fluxo de mudança

1. Comece pelo contrato em `packages/shared` quando a mudança atravessar camadas.
2. Implemente a regra no service do domínio em `services/api/src/core` e cubra a invariante com Vitest.
3. Exponha a regra por handler/rota e preserve auth, tenant, rate limit, auditoria e redaction.
4. Atualize a view reutilizando os padrões de `apps/web/src/components` e das views vizinhas.
5. Se houver schema, crie migration versionada e valide banco vazio + seed.
6. Se houver UI ou navegação, rode o projeto Playwright adequado.
7. Atualize ADR, spec, task ou runbook somente quando o contrato operacional mudar.

Não use sucesso local/fake para declarar integração live, rollout ou produção aprovados.

## Validação antes de revisão

Para uma mudança comum:

```bash
npm run check
npm run check:docs
npm run repo:hygiene
```

Acrescente conforme o risco:

- schema/seed: `npm run db:test:migrations`;
- UI/navegação: `npm run test:e2e:smoke` ou `npm run test:e2e`;
- auth/permissões beta: `npm run beta:preflight`;
- Redis/jobs: `npm run test:jobs:redis`;
- endpoint quente: `npm run perf:smoke`.

## Documentação de referência

- [Arquitetura geral](docs/architecture/README.md)
- [Arquitetura CaseFlow + Companion](docs/architecture/caseflow-architecture.md)
- [Mapa de manutenção](docs/architecture/maintenance-map.md)
- [Estratégia de testes](docs/testing/strategy.md)
- [OpenAPI v1](docs/api/openapi.v1.yaml)
- [Threat model](docs/security/threat-model.md)
- [Runbook do Companion local](docs/operations/companion-local-runbook.md)
- [Backup e restore](docs/operations/backup-restore-runbook.md)
- [Ledger de prontidão](docs/operations/project-readiness-ledger.md)
- [Roadmap](docs/tasks/ROADMAP.md)

## Limites operacionais

- SQLite e storage local são adequados para desenvolvimento e demo controlada, não para exposição externa.
- O Core não controla abas nem armazena cookies; isso pertence ao Companion local.
- Login, captcha e 2FA exigem intervenção humana.
- O Companion não confirma submit destrutivo, financeiro ou de atendimento.
- O legado SyLembra fica desativado por padrão com `ENABLE_LEGACY_SYLEMBRA=false`.
