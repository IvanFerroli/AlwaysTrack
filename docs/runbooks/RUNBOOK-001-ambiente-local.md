# RUNBOOK-001 - Ambiente local

## Metadata
- status: active
- owner: ops-builder
- last-updated: 2026-06-04
- source-of-truth: docs/runbooks/RUNBOOK-001-ambiente-local.md

## Objetivo
Subir a base local do AlwaysTrack sem secrets reais e com banco/storage de desenvolvimento.

## Pre-condicoes
- Node 22+ e npm instalados.
- `main` recém-baixada ou clonada.
- Nenhuma credencial real salva em arquivo versionado.

## Passos operacionais
1. Se houver um `.env` pré-configurado, colocá-lo na raiz por canal privado; sem ele, os defaults locais são suficientes.
2. Rodar `npm run up` para instalar pelo lockfile, preparar banco/seed e subir API, Web, Prisma Studio e Hub.
3. Validar os serviços no Hub aberto automaticamente.
4. Encerrar a bancada com `Ctrl+C`.

`npm run setup` continua disponível para preparar banco/seed sem manter serviços ativos. `npm run up:full` também regenera coverage, E2E e carga e exige as dependências de sistema do Playwright.

## Runtime local esperado
- Web: Vite/React em `http://localhost:5173`.
- API: Express em `http://localhost:3333`.
- Prisma Studio: porta `5555` quando iniciado pelo script.
- Banco: SQLite em `services/api/prisma/dev.db`.
- Storage: arquivos privados em `services/api/.storage/`.
- Workspaces npm usam o namespace `@alwaystrack/*`.

## Validacao
- `npm run check`
- `curl http://localhost:3333/health`
- Login local padrão: `admin@example.com` / `AlwaysTrackDev123!`; um `.env` pré-configurado pode substituir esse valor.

## Seed local
- `npm run setup` alinha o banco local e aplica o seed idempotente.
- Por padrao, o seed local cria uma demo comercial: admin, SAC, financeiro, vendedor, supervisor comercial, grupo de vendas, nota fiscal aprovada, campanha e wiki.
- `SEED_ORGANIZATION_ID` e `SEED_ORGANIZATION_NAME` definem a organizacao criada pelo seed idempotente.
- `SEED_ADMIN_PASSWORD`, `SEED_SAC_PASSWORD`, `SEED_FINANCEIRO_PASSWORD`, `SEED_SELLER_PASSWORD` e `SEED_SUPERVISOR_PASSWORD` fixam credenciais comerciais locais; se vazios, o seed imprime valores temporarios.
- `ENABLE_LEGACY_SYLEMBRA=true` reativa fixtures antigas de RT, unidades/setores, profissionais, licencas, documentos, upload publico e notificacoes de licenca. Sem essa flag, elas ficam desligadas.
- Com legado ativo, `SEED_RT_PASSWORD` e `SEED_UPLOAD_TOKEN` fixam a senha do RT e o token publico antigos.
- `npm run db:flush:local` reseta o banco local, limpa o storage privado e recria uma organizacao minima com um admin. Templates/regras antigas de licenca so sao recriadas com `ENABLE_LEGACY_SYLEMBRA=true`.
- `db:flush:demo` continua como alias legado para compatibilidade operacional.
- `FLUSH_LOCAL_*` controla o flush local; `FLUSH_DEMO_*` ainda e aceito como fallback legado.

## Secrets
- Nunca commitar `.env`, `.env.local`, banco local, storage local ou logs.
- Nunca commitar diretorios temporarios como `.tmp-*`, `.openclaw/` ou virtualenvs.
- Para Meta real, preencher apenas no ambiente local privado ou no painel do provider.
- `APP_NAME` afeta mensagens geradas pela API; `VITE_APP_NAME` afeta titulo, manifest e marca visivel da web.
- `SESSION_SECRET` deve ser longo e exclusivo por ambiente.
- `SESSION_COOKIE_NAME` pode ser ajustado por ambiente; manter o mesmo valor entre login e API protegida.
- Login Google local usa `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET`, `GOOGLE_LOGIN_REDIRECT_URI` e `GOOGLE_LOGIN_ALLOWED_DOMAINS` quando configurado. Sem dominio permitido, o login Google fica desabilitado por politica interna e a tela mantém o fallback de email/senha.
- Homologação fechada usa `APP_MODE=beta-local`, `VITE_APP_MODE=beta-local` e `BETA_ALLOWED_EMAILS` com a lista nominal de emails permitidos. Sem `BETA_ALLOWED_EMAILS`, `npm run env:check` deve falhar para evitar beta aberto por engano.

## Contingencia
1. Encerrar serviços com `Ctrl+C`.
2. Se portas travarem: `fuser -k 3333/tcp 5173/tcp 5555/tcp`.
3. Se schema local divergir: rodar `npm run setup`.
