# TASK-AT-003 - Local seed contract

## Metadata
- status: proposed
- owner: scaffolding-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-003-local-seed-contract.md

## Modo
- mode: implementation

## Objetivo unico
Consolidar o seed local como contrato explicito de desenvolvimento e demonstracao controlada.

## Contexto minimo
`EXEC-AT-001` removeu ruido herdado e parametrizou a organizacao seedada. Falta fechar compatibilidade operacional, nomes de comandos e documentacao de reset local.

## Inputs
- `services/api/prisma/seed.ts`
- `scripts/flush-local-demo.js`
- `scripts/start-all.js`
- `package.json`
- `docs/runbooks/RUNBOOK-001-ambiente-local.md`

## Dependencias
- satisfeitas: `TASK-AT-001`, `TASK-AT-002`
- em aberto: decisao sobre manter alias `demo` indefinidamente

## Alvos explicitos
1. Alias de comando local para flush/reset.
2. Contrato de env vars `SEED_*`.
3. Documentacao de reset para bancos locais antigos.

## Fora de escopo
- Migracao de dados reais.
- Troca de schema Prisma.
- Remocao brusca de comandos existentes.

## Checklist
1. Adicionar alias compatível se necessario.
2. Documentar contrato de seed local.
3. Validar `npm run setup`.
4. Validar `npm run check`.
