# TASK-AT-002 - Runtime copy and seed cleanup

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-002-runtime-copy-seed-cleanup.md

## Modo
- mode: implementation

## Objetivo unico
Remover ruido publico de V1/demo herdado sem refatorar o dominio funcional.

## Contexto minimo
O AlwaysTrack ja esta parametrizado por `APP_NAME`/`VITE_APP_NAME`, mas ainda havia copy visivel de V1 e metadata de seed apontando para task historica.

## Inputs
- `apps/web/src/main.tsx`
- `services/api/prisma/seed.ts`
- `.env.example`
- `docs/runbooks/RUNBOOK-001-ambiente-local.md`

## Dependencias
- satisfeitas: ADR-002 aceita; transicao encerrada
- em aberto: contrato de beta externo

## Alvos explicitos
1. Copy da tela Como usar.
2. Seed local e metadata de auditoria.
3. Variaveis de seed em `.env.example`.
4. Runbook local.

## Fora de escopo
- Renomear `db:flush:demo` ou remover script de compatibilidade.
- Trocar rotas `/v1`.
- Alterar schema ou migracoes.

## Checklist
1. Remover "V1" da ajuda operacional.
2. Parametrizar organizacao seedada por env.
3. Remover referencia runtime a `TASK-REL-001`.
4. Validar com `npm run check`.
