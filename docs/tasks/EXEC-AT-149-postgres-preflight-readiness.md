# EXEC-AT-149 - Preflight para migracao real Postgres

## Metadata
- status: blocked-external-infra-ready
- owner: olympus-orchestrator
- completed-at: 2026-06-19
- related-task: docs/tasks/TASK-AT-149-prod-postgres-migration-execution.md

## Escopo entregue
- Script `npm run db:postgres:preflight`.
- Variaveis documentadas em `.env.example`:
  - `POSTGRES_DATABASE_URL`
  - `POSTGRES_BACKUP_CONFIRMED`
  - `POSTGRES_RESTORE_DRY_RUN_CONFIRMED`
- `env:check --production` reconhece e valida storage S3 quando `STORAGE_PROVIDER=s3`.

## O que o preflight confere
- URL Postgres real, nao SQLite.
- Storage externo S3-compatible configurado.
- Confirmacao explicita de backup.
- Confirmacao explicita de restore dry-run.
- Schema local-first ainda valida antes da branch de conversao.
- Guard de ambiente de producao passa.

## Por que nao foi executado migrate real
Nao ha `DATABASE_URL` de staging/producao, credenciais nem evidencia de backup/PITR nesta sessao. Executar ou simular migration real sem esses itens deixaria uma documentacao enganosa para dados fiscais.

## Proximo passo quando houver infra
1. Criar branch dedicada.
2. Trocar datasource Prisma para `postgresql`.
3. Gerar baseline/migration em banco descartavel.
4. Rodar `npm run db:postgres:preflight`.
5. Rodar `npx prisma migrate deploy`.
6. Rodar smoke completo de DANFE, ranking, Wiki, FAQ, Scriptoteca e auditoria.
