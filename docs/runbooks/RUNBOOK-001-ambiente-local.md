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
- Repo clonado.
- Nenhuma credencial real salva em arquivo versionado.

## Passos operacionais
1. Criar `.env` a partir de `.env.example`.
2. Manter `NOTIFICATION_PROVIDER=fake` para desenvolvimento sem Meta.
3. Rodar `npm install`.
4. Rodar `npm run env:check`.
5. Rodar `npm run setup` para gerar Prisma Client, alinhar SQLite e aplicar seed.
6. Rodar `npm run up -- --no-open` para API, web e Prisma Studio.

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
- Login local: `admin@example.com` / valor impresso pelo seed ou `SEED_ADMIN_PASSWORD`

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

## Contingencia
1. Encerrar serviços com `Ctrl+C`.
2. Se portas travarem: `fuser -k 3333/tcp 5173/tcp 5555/tcp`.
3. Se schema local divergir: rodar `npm run setup`.
