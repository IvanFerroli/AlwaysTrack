# TASK-DAT-002 - Indices, constraints e seed minimo

## Metadata
- status: proposed
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
