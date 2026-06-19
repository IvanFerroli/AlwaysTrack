# TASK-AT-149 - Migracao real para Postgres em staging/producao

## Metadata
- status: blocked-external-infra-ready
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-149-prod-postgres-migration-execution.md

## Modo
- mode: migration

## Objetivo unico
Migrar o AlwaysTrack de SQLite local-first para Postgres em staging/producao quando houver infraestrutura definida.

## Contexto minimo
`TASK-AT-147` documentou o caminho seguro. A execucao real depende de host Postgres, credenciais, backup/PITR e janela de validacao.

## Inputs
- Host Postgres gerenciado.
- `DATABASE_URL` de staging.
- Decisao sobre seed/demo versus dados reais.

## Dependencias
- satisfeitas: `TASK-AT-147`, `ADR-003`, runbook de backup/restore.
- satisfeitas nesta fatia: preflight automatizado de prerequisitos.
- em aberto: infraestrutura Postgres, URL de staging/producao e estrategia de deploy.

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. `services/api/prisma/migrations/`
3. `docs/operations/production-postgres-storage-readiness.md`

## Fora de escopo
- Implementar provider de storage externo.
- Migrar dados reais sem backup aprovado.
- Trocar o datasource Prisma local-first para Postgres sem ambiente real de staging.

## Resultado entregue nesta rodada
1. Script `npm run db:postgres:preflight` para validar prerequisitos antes de abrir branch de migracao real.
2. Guardas exigidas:
   - `DATABASE_URL` ou `POSTGRES_DATABASE_URL` com `postgres://` ou `postgresql://`.
   - `STORAGE_PROVIDER=s3` e variaveis `STORAGE_S3_*` minimas.
   - `POSTGRES_BACKUP_CONFIRMED=true`.
   - `POSTGRES_RESTORE_DRY_RUN_CONFIRMED=true`.
3. `env:check --production` passou a conhecer variaveis de storage externo.
4. `.env.example` documenta flags de confirmacao de backup/restore.

## Bloqueio atual
A execucao real de `prisma migrate deploy` em Postgres continua bloqueada por falta de banco gerenciado/credenciais. Esta task esta pronta para execucao quando a infraestrutura existir; nao foi marcada como migracao concluida para nao criar falso positivo operacional.

## Checklist
1. Criar branch isolada de migracao.
2. Ajustar datasource Prisma para Postgres.
3. Validar migrations em banco descartavel.
4. Rodar smoke comercial e conhecimento operacional.
5. Executar restore dry-run.

## Acceptance Criteria
1. Local continua documentado e funcional.
2. Staging Postgres aplica migrations limpas.
3. Smoke de DANFE, ranking, Wiki, FAQ, Scriptoteca e auditoria passa.

## Definition of Done
1. Plano de rollback anexado ao EXEC.
2. Evidencia segura de migration/staging registrada.
3. Risco residual documentado.

## Validacao
- comandos/checks:
  - `npm run db:postgres:preflight` deve falhar localmente enquanto prerequisitos reais nao existirem.
  - `npm run db:test:migrations`
  - `npx prisma validate --schema services/api/prisma/schema.prisma`
  - em staging real: `npx prisma migrate deploy`, testes API e smoke API.
- revisao manual: login admin, upload DANFE, ranking, anexo Wiki.

## Evidencia esperada
- Logs sem segredos de migration.
- Checklist de restore dry-run.

## Riscos
- Divergencia SQLite/Postgres.
- Dados fiscais reais expostos em logs.

## Blockers possiveis
- Sem banco gerenciado.
- Sem backup/PITR.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
