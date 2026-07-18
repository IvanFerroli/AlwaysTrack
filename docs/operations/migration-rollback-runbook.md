# Migration and Rollback Runbook

## Metadata
- status: active
- owner: platform-maintainers
- last-updated: 2026-07-17

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
`npm run db:test:migrations` cria SQLite temporario a partir do schema Prisma final, valida o SQL de bootstrap e remove o arquivo no final. Esse comando nao comprova replay incremental da pasta `prisma/migrations`.

## Banco seedado
O mesmo comando cria outro SQLite temporario a partir do schema final, roda o seed local com senhas estaveis e valida copia de backup/restore local.

## Replay incremental
- Antes de staging, restaure uma copia sanitizada do ultimo backup homologado e execute `prisma migrate deploy` nessa copia.
- Registre migrations aplicadas, duracao, contagens antes/depois, constraints orfas e checksum do backup.
- A cadeia historica atual possui migrations que dependem de tabelas introduzidas posteriormente. Enquanto esse replay nao estiver reconciliado, `db:test:migrations` e evidencia de schema/seed, nao de upgrade incremental.
- Escalas e Avisos recorrentes permanecem aditivos e nullable no primeiro rollout. `NOT NULL`, remocao de fallback e backfill definitivo exigem replay production-like aprovado.

## Reversao
- App-only: volte o commit/deploy e mantenha banco intacto.
- Migration com problema: pare writes, restaure backup anterior e suba hotfix compativel.
- Migration aditiva aplicada com app revertido: mantenha tabelas/colunas, reverta somente o app e desative a feature; nao execute `DROP` como resposta imediata.
- Seed/flush local: use `npm run db:flush:local`; nunca rode flush em staging/producao.
- Dado corrompido: criar script/hotfix idempotente com filtro por `organizationId`, registrar auditoria e anexar evidencia.

## Higiene
- `services/api/prisma/dev.db`, backups locais, `.env*` e `docs/generated/` nao devem entrar no Git.
- `npm run repo:hygiene` falha se algum desses artefatos estiver rastreado.
