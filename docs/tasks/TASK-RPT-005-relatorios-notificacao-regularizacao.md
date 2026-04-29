# TASK-RPT-005 - Relatorios de notificacao e regularizacao

## Metadata
- status: proposed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-RPT-005-relatorios-notificacao-regularizacao.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Exibir historico de notificacoes e ciclo de regularizacao.

## Inputs
- documento central, secoes 8.7 e 8.8

## Dependencias
- satisfeitas: `TASK-RPT-001`, `TASK-NOT-005`
- em aberto: n/a

## Alvos explicitos
1. relatorio de notificacoes
2. relatorio de historico de regularizacao

## Fora de escopo
- analytics preditivo

## Acceptance Criteria
1. Notificacoes mostram canal, template, destinatario, status, datas, erro e providerMessageId.
2. Regularizacao mostra notificacao, upload, validacao e tempo total.
3. Filtros por status, canal, periodo, tipo, RT, unidade e setor funcionam.

## Validacao
- testes de query
- smoke manual com eventos fake

## Riscos
- nao registrar timestamps necessarios antes desta task
