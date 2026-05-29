# TASK-DAT-002 - Indices, constraints e seed minimo

## Metadata
- status: completed
- owner: contracts-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-DAT-002-indices-constraints-seed-minimo.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- data/modeling specialist
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Adicionar constraints, indices e seed minimo seguro para desenvolvimento e demo inicial.

## Inputs
- `TASK-DAT-001`
- documento central, secoes 13, 17 e 20

## Dependencias
- satisfeitas: `TASK-DAT-001`
- em aberto: n/a

## Alvos explicitos
1. indices por `organizationId`, status, vencimento e responsavel
2. constraints de unicidade/dedupe onde aplicavel
3. seed de org/admin/tipos/templates/regras placeholders

## Fora de escopo
- massa final de demonstracao
- dados reais de cliente

## Acceptance Criteria
1. Consultas de dashboard/relatorio tem indices basicos.
2. UploadToken tem indice seguro por `tokenHash`.
3. NotificationJob evita duplicidade por licenca/regra/periodo.
4. Seed nao contem dado sensivel real.

## Validacao
- `npx prisma validate`
- `npx prisma migrate dev`
- rodar seed local

## Riscos
- duplicidade de jobs gerar spam/custo
- seed vazar dados pessoais

## Execucao
- Adicionados constraints de dedupe para unidade por organizacao, setor por unidade, profissional por CPF dentro da organizacao, tipo de licenca por organizacao e licenca por profissional/tipo/numero.
- `NotificationJob` ganhou `notificationRuleId`, `periodKey`, `dedupeKey`, indice por regra/periodo e constraint unica por licenca/regra/periodo.
- Seed minimo expandido com organizacao demo, admin demo, unidade/setor demo, profissional demo, tipo de licenca demo, licenca demo, template placeholder e regra placeholder.
- O seed usa apenas dados ficticios e idempotentes.
- `scripts/start-all.js` agora verifica diff entre o banco local existente e o schema Prisma, aplicando SQL pendente antes do seed.

## Evidencias
- `DATABASE_URL='file:./dev.db' npx prisma validate --schema services/api/prisma/schema.prisma`
- `DATABASE_URL='file:./dev.db' npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260429143000_dat002_constraints_seed/migration.sql`
- `DATABASE_URL='file:./dev.db' npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260429143500_dat002_notification_job_composite/migration.sql`
- `DATABASE_URL='file:./dev.db' npm run prisma:seed` executado duas vezes
- Replay das migrations versionadas em SQLite temporario limpo via `prisma db execute`
- `npm run check`
- `npm run setup`
