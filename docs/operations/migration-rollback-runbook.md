# Migration and Rollback Runbook

## Metadata
- status: active
- owner: platform-maintainers
- last-updated: 2026-06-09

## Politica
- Dev local pode usar `npm run setup` e `npm run db:flush:local`.
- Staging/producao devem aplicar migration depois de backup verificavel.
- Rollback de schema e uma operacao: restaurar backup ou aplicar hotfix planejado.

## Validacao local
1. Rode `npm run db:test:migrations`.
2. Rode `npm run setup`.
3. Rode `npm run check`.
4. Rode `npm run repo:hygiene` antes de commitar.

## Banco vazio
`npm run db:test:migrations` cria SQLite temporario, aplica `prisma migrate deploy` e remove o arquivo no final.

## Banco seedado
O mesmo comando cria outro SQLite temporario, aplica migrations, roda seed comercial com senhas estaveis e valida copia de backup/restore local.

## Reversao
- App-only: volte o commit/deploy e mantenha banco intacto.
- Migration com problema: pare writes, restaure backup anterior e suba hotfix compativel.
- Seed/flush local: use `npm run db:flush:local`; nunca rode flush em staging/producao.
- Dado corrompido: criar script/hotfix idempotente com filtro por `organizationId`, registrar auditoria e anexar evidencia.

## Higiene
- `services/api/prisma/dev.db`, backups locais, `.env*` e `docs/generated/` nao devem entrar no Git.
- `npm run repo:hygiene` falha se algum desses artefatos estiver rastreado.
