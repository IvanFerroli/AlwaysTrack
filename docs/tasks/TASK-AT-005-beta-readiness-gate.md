# TASK-AT-005 - Beta readiness gate

## Metadata
- status: proposed
- owner: ops-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-005-beta-readiness-gate.md

## Modo
- mode: verification

## Objetivo unico
Definir e validar o gate minimo para beta externo controlado.

## Contexto minimo
O AlwaysTrack ainda usa defaults local-first e integracoes fake/local por seguranca. Antes de beta externo, o projeto precisa de um checklist objetivo de ambiente, dados, seguranca e suporte.

## Inputs
- `docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md`
- `docs/operations/orchestrator-state.md`
- `.env.example`
- `.github/workflows/check.yml`

## Dependencias
- satisfeitas: `TASK-AT-001`
- em aberto: decisao de ambiente beta

## Alvos explicitos
1. Checklist de env e secrets.
2. Banco/storage local-first com volumes ou decisao nova.
3. Integracoes fake vs reais por ambiente.
4. Evidencia de validacao.

## Fora de escopo
- Provisionar ambiente externo sem aprovacao.
- Habilitar provider real sem credenciais privadas.
- Prometer disponibilidade de producao.

## Checklist
1. Escrever gate de beta.
2. Conferir `env:check --production`.
3. Conferir `npm run check`.
4. Registrar residuos e decisao final.
