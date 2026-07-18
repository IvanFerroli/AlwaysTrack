# TASK-AT-387 - Seed SAC deterministico e cenarios de demonstracao

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-387-sac-deterministic-seed-demo-scenarios.md

## Modo
- mode: implementation

## Objetivo unico
Criar massa sintetica idempotente que exercite Pausas, Performance, Campanhas e preservacao do legado sem parecer dado live.

## Contexto minimo
Slots sem disputa, metricas sem revisao ou um unico time nao validam os riscos reais nem sustentam E2E e demo confiaveis.

## Dependencias
- satisfeitas: TASK-AT-372, TASK-AT-377, TASK-AT-380 e TASK-AT-384.
- em aberto: n/a.

## Alvos explicitos
1. Seed Prisma e reset/demo local.
2. Fixtures sinteticas compartilhadas por testes e demo.
3. Checklist de contas/cenarios sem segredos reais.

## Fora de escopo
- Importar nomes, emails ou indicadores de producao.
- Apagar massa legada existente para simplificar seed.

## Checklist
1. Criar ao menos dois times, lideres e atendentes SAC ativos/inativos.
2. Criar slots livres/cheios, troca pendente/concluida e override com breach.
3. Criar batches draft/submitted/approved/rejected/superseded das quatro metricas.
4. Criar campanhas draft/ativa/encerrada com dados completos/parciais.
5. Preservar amostra `SALES_LEGACY` claramente rotulada para teste de compatibilidade.

## Acceptance Criteria
1. Rodar seed duas vezes produz o mesmo estado logico sem duplicacao.
2. E2E encontra todos os cenarios por chaves estaveis.
3. Datas sao relativas/controladas e nao expiram silenciosamente.
4. UI identifica massa como demo/local e nunca como evidencia live.

## Validacao
- comandos/checks: seed/reset repetido, contagens/checksums, E2E focado e `npm run repo:hygiene`.
- revisao manual: login por role e walkthrough dos cenarios.

## Riscos
- Datas baseadas em `now()` tornarem testes nao deterministas.

## Proximo passo provavel
TASK-AT-388

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: fixtures sinteticas, temporais e idempotentes.
