# TASK-DEP-002 - Deploy e jobs em producao

## Metadata
- status: proposed
- owner: ops-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-DEP-002-deploy-producao-jobs.md

## Modo
- mode: implementation

## Agentes sugeridos
- ops builder
- runtime builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Preparar deploy economico com web, API, banco, storage, cron/worker e webhook publico.

## Inputs
- documento central, secao 15

## Dependencias
- satisfeitas: `TASK-NOT-005`, `TASK-DEP-001`
- em aberto: providers finais

## Alvos explicitos
1. config de deploy
2. job agendado
3. URL publica para webhook Meta
4. runbook de deploy

## Fora de escopo
- Kubernetes
- Redis obrigatorio

## Acceptance Criteria
1. Web e API deployam com envs separados.
2. Cron/worker roda de forma previsivel.
3. Webhook fica acessivel e seguro.
4. Logs basicos permitem investigar falhas.

## Validacao
- deploy smoke
- webhook smoke

## Riscos
- cron nao rodar no provider escolhido
