# TASK-AT-410 - Testes de dominio, integracao e concorrencia

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-410-scheduling-domain-integration-concurrency-tests.md

## Modo
- mode: verification

## Objetivo unico
Estender TASK-AT-384 com testes unitarios/service/HTTP para regras temporais, tenancy, idempotencia e corridas da nova frente.

## Contexto minimo
Os riscos centrais sao precedencia temporal, reprocessamento, troca atomica, Pausa concorrente e scheduler. Mocks isolados nao provam constraints Postgres nem ordem de locks.

## Dependencias
- satisfeitas: TASK-AT-384 e TASK-AT-393 a TASK-AT-409.
- em aberto: ambiente Postgres production-like.

## Alvos explicitos
1. Suites de compilador/materializador, workflows e coverage read model.
2. HTTP/RBAC/anti-IDOR de Escalas, Notificacoes e Avisos.
3. Migration/compatibility e concorrencia Postgres.

## Fora de escopo
- Cobrir UI ou performance de carga nesta task.
- Aceitar apenas snapshots de objeto como prova de regra.

## Checklist
1. Golden cases de timezone, DST, meia-noite, fevereiro e dias 14/29.
2. Property tests de recorrencia, sobreposicao, descanso e precedencia.
3. Corridas entre materializador/regra/excecao, troca/Pausa e scheduler/edicao.
4. Idempotencia de job, notificacao, remarcacao e catch-up.
5. Matriz negativa role x tenant x time x estado x periodo.
6. Mutant/negative assertions para provar filtros criticos.

## Acceptance Criteria
1. Cada invariante do backlog possui teste positivo/negativo aplicavel.
2. Retirar filtro tenant/escala efetiva/idempotency key faz teste falhar.
3. Concorrencia production-like converge sem estado parcial/duplicado.
4. Fixtures usam relogio controlado e dados sinteticos.

## Validacao
- comandos/checks: suites API/Shared, migration test, Postgres concurrency e `npm run repo:hygiene`.
- revisao manual: matriz requisito -> teste -> ambiente -> evidencia.

## Riscos
- Fake timers globais vazarem estado entre suites e mascararem timezone.

## Proximo passo provavel
TASK-AT-411

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: separar prova local de prova production-like.

