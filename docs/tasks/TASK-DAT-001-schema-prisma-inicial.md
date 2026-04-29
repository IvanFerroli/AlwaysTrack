# TASK-DAT-001 - Schema Prisma inicial completo

## Metadata
- status: completed
- owner: contracts-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-DAT-001-schema-prisma-inicial.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- data/modeling specialist
- `olympus_task_verifier`

## Objetivo unico
Criar o schema inicial com as entidades centrais sem simplificar contra o dominio.

## Inputs
- documento central, secao 13

## Dependencias
- satisfeitas: `TASK-SCF-001`, `TASK-QLT-001`
- em aberto: decisao local de `DATABASE_URL`

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. migration inicial
3. contratos compartilhados de enums/status

## Fora de escopo
- CRUDs completos
- seed de demo final

## Acceptance Criteria
1. Entidades User, Organization, Unit, Sector, Professional, LicenseType, License, Document, UploadToken, NotificationTemplate, NotificationRule, NotificationJob, NotificationLog, FaqItem e AuditLog existem.
2. `User` e `Professional` ficam separados.
3. `organizationId` existe nas entidades centrais aplicaveis.
4. Status de licenca e documento sao enums separados.

## Validacao
- `npx prisma validate`
- `npx prisma migrate dev`
- `npm run typecheck`

## Riscos
- schema simplificado gerar rework estrutural
- relacoes ficarem frouxas para relatorios

## Execucao
- Implementado em modo incremental sobre auth/audit existentes, preservando `Organization`, `User` e `AuditLog`.
- Adicionadas as entidades de dominio: `Unit`, `Sector`, `Professional`, `LicenseType`, `License`, `Document`, `UploadToken`, `NotificationTemplate`, `NotificationRule`, `NotificationJob`, `NotificationLog` e `FaqItem`.
- Contratos compartilhados de status/canais adicionados em `packages/shared/src/index.ts`.
- Status foram mantidos como `String` no Prisma por compatibilidade com SQLite local; os contratos TS funcionam como enum compartilhado ate a decisao de banco final.

## Evidencias
- `DATABASE_URL='file:./dev.db' npx prisma validate --schema services/api/prisma/schema.prisma`
- `DATABASE_URL='file:./dev.db' npx prisma db execute --schema services/api/prisma/schema.prisma --file services/api/prisma/migrations/20260429140500_dat001_domain_schema/migration.sql`
- `npm run prisma:generate`
- `npm run check`
- `npm run setup`
- Smoke: `/health`, `/v1/auth/login`, `/v1/auth/me`, `/v1/audit-logs`
- Replay das 3 migrations em SQLite temporario limpo via `prisma db execute`
