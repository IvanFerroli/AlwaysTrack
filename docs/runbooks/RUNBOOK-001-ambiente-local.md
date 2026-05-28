# RUNBOOK-001 - Ambiente local

## Metadata
- status: active
- owner: ops-builder
- last-updated: 2026-05-28
- source-of-truth: docs/runbooks/RUNBOOK-001-ambiente-local.md

## Objetivo
Subir a base local do AlwaysTrack/SyLembra sem secrets reais e com banco/storage de desenvolvimento.

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
- Workspaces npm ainda usam o namespace `@sylembra/*` ate a decisao de rebrand.

## Validacao
- `npm run check`
- `curl http://localhost:3333/health`
- Login demo: `admin@example.com` / valor impresso pelo seed ou `SEED_ADMIN_PASSWORD`

## Secrets
- Nunca commitar `.env`, `.env.local`, banco local, storage local ou logs.
- Nunca commitar diretorios temporarios como `.tmp-*`, `.openclaw/` ou virtualenvs.
- Para Meta real, preencher apenas no ambiente local privado ou no painel do provider.
- `SESSION_SECRET` deve ser longo e exclusivo por ambiente.

## Contingencia
1. Encerrar serviços com `Ctrl+C`.
2. Se portas travarem: `fuser -k 3333/tcp 5173/tcp 5555/tcp`.
3. Se schema local divergir: rodar `npm run setup`.
