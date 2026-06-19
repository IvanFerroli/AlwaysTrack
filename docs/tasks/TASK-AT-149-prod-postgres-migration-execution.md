# TASK-AT-149 - Migracao real para Postgres em staging/producao

## Metadata
- status: proposed-blocked-by-infra-decision
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
- em aberto: infraestrutura Postgres e estrategia de deploy.

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. `services/api/prisma/migrations/`
3. `docs/operations/production-postgres-storage-readiness.md`

## Fora de escopo
- Implementar provider de storage externo.
- Migrar dados reais sem backup aprovado.

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
- comandos/checks: `npx prisma validate`, `npx prisma migrate deploy`, `npm run test --workspace @alwaystrack/api`, smoke API.
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
