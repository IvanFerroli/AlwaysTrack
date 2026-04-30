# TASK-DEP-001 - Ambiente local e secrets

## Metadata
- status: completed
- owner: ops-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-DEP-001-ambiente-local-secrets.md

## Modo
- mode: implementation

## Agentes sugeridos
- ops builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Documentar e automatizar ambiente local com banco, storage fake/real e secrets seguros.

## Inputs
- documento central, secoes 15 e 19

## Dependencias
- satisfeitas: `TASK-SCF-001`, `TASK-DAT-001`
- em aberto: escolha de provider local

## Alvos explicitos
1. `.env.example`
2. scripts de setup
3. runbook local

## Fora de escopo
- deploy final

## Acceptance Criteria
1. Novo dev sobe API, web e banco com instrucoes claras.
2. Secrets reais nao entram no repo.
3. Meta/storage podem rodar com mocks quando necessario.

## Validacao
- setup local limpo
- `npm run check`

## Riscos
- vazar credenciais

## Evidencias de conclusao
- `.env.example` reorganizado com envs locais, web/API, storage, Meta e job.
- Criado `npm run env:check` com leitura de `.env`/`.env.production` e validacao estrita em producao.
- `npm run setup` permanece como bootstrap local de Prisma, SQLite e seed.
- Criado runbook local `docs/runbooks/RUNBOOK-001-ambiente-local.md`.
- Secrets reais continuam bloqueados por `.gitignore`; storage/banco/logs locais nao entram no repo.

## Validacao executada
- `npm run env:check` - passou em modo local.
- `npm run setup` - passou.
- `npm run check` - 88 testes passaram.
- `npm run build --workspace @sylembra/web` - build passou.
