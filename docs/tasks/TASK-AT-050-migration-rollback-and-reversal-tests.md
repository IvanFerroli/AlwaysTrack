# TASK-AT-050 - Migration rollback and reversal tests

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-050-migration-rollback-and-reversal-tests.md

## Modo
- mode: data-safety

## Objetivo unico
Criar testes e runbooks de reversao para reduzir risco em migrations, seeds, flush local e mudancas de schema/dados.

## Contexto minimo
O projeto usa Prisma + SQLite e ja teve migrations aplicadas manualmente por causa de drift local. Para ficar "a prova de balas", qualquer dev precisa conseguir validar upgrade, rollback operacional e recuperacao sem destruir dados importantes.

## Alvos explicitos
1. Documentar politica de migrations: dev, staging, producao.
2. Criar teste de migration em banco vazio.
3. Criar teste de migration em banco com seed comercial.
4. Criar teste de backup/restore local.
5. Criar fixtures de regressao para:
   - notas aprovadas/rejeitadas/duplicadas;
   - Wiki/FAQ/notificacoes;
   - usuarios/roles/vendedores/grupos.
6. Criar runbook de reversao por tipo:
   - rollback de deploy app-only;
   - migration com backup restore;
   - seed/flush local;
   - hotfix de dado corrompido.
7. Criar checagem para impedir commit de `dev.db` e backups.

## Fora de escopo
- Garantir rollback automatico perfeito de toda migration destrutiva.
- Criar estrategia final de banco gerenciado; isso pode virar ADR propria.

## Acceptance Criteria
1. Existe comando local para validar migrations em banco temporario.
2. Runbook explica rollback com passos concretos.
3. CI falha se migration nova nao aplicar em banco limpo.
4. Backups locais seguem ignorados pelo Git.

## Validacao
- `npm run db:test:migrations`
- `npm run setup`
- `npm run check`

## Riscos
- SQLite local nao representa totalmente producao futura se migrar para Postgres.
- Rollback de schema precisa ser tratado como operacao, nao promessa magica.

