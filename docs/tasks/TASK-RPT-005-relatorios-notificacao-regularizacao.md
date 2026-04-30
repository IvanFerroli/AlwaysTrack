# TASK-RPT-005 - Relatorios de notificacao e regularizacao

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-30
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

## Evidencias de conclusao
- Implementados `GET /v1/reports/notifications` e `GET /v1/reports/regularization`.
- Notificacoes exibem canal, template, destinatario, status, datas, erro e `providerMessageId`.
- Regularizacao cruza ultima notificacao da licenca, upload, validacao e tempo total.
- Filtros por status, canal, periodo, tipo, RT, unidade e setor usam a camada comum.

## Validacao executada
- `npm run check` - 87 testes passaram.
- `npm run build --workspace @sylembra/web` - build passou.
- Smoke local: endpoints de notificacoes e regularizacao responderam `ok`.
