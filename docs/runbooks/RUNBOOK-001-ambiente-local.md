# RUNBOOK-001 - Ambiente local

## Metadata
- status: active
- owner: ops-builder
- last-updated: 2026-04-30
- source-of-truth: docs/runbooks/RUNBOOK-001-ambiente-local.md

## Objetivo
Subir SyLembra localmente sem secrets reais e com banco/storage de desenvolvimento.

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

## Validacao
- `npm run check`
- `curl http://localhost:3333/health`
- Login demo: `admin@example.com` / `admin123`

## Secrets
- Nunca commitar `.env`, `.env.local`, banco local, storage local ou logs.
- Para Meta real, preencher apenas no ambiente local privado ou no painel do provider.
- `SESSION_SECRET` deve ser longo e exclusivo por ambiente.

## Contingencia
1. Encerrar serviços com `Ctrl+C`.
2. Se portas travarem: `fuser -k 3333/tcp 5173/tcp 5555/tcp`.
3. Se schema local divergir: rodar `npm run setup`.
