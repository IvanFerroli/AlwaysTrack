# TASK-AT-384 - Testes de dominio, API e seguranca SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-384-sac-domain-api-security-tests.md

## Modo
- mode: verification

## Objetivo unico
Fechar a matriz de testes de regras, HTTP, tenancy, RBAC, auditoria, idempotencia e concorrencia dos novos dominios.

## Contexto minimo
Os riscos principais nao sao apenas renderizacao: overbooking, media incorreta, versao perdida, cross-tenant e escrita legada precisam de regressao direta.

## Dependencias
- satisfeitas: TASK-AT-366 a TASK-AT-383.
- em aberto: Postgres/Redis production-like para cenarios que SQLite nao representa.

## Alvos explicitos
1. Suites unit/service/HTTP de Pausas, Performance e Campanhas.
2. Matriz negativa role x tenant x time x estado.
3. Testes de migracao, compatibilidade e freeze de Vendas.

## Fora de escopo
- Concluir validacao visual ou live.
- Aceitar snapshot test como unica prova de regra.

## Checklist
1. Cobrir bordas de intervalo, timezone, capacidade e swaps concorrentes.
2. Cobrir golden cases de CSAT/SLA/produtividade/ReclameAqui.
3. Cobrir maker-checker, revisoes, idempotencia e CSV injection.
4. Cobrir filtro de dominio de campanhas e anti-IDOR.
5. Cobrir toda escrita legada bloqueada e leitura historica autorizada.

## Acceptance Criteria
1. Cada invariante do backlog possui ao menos um teste positivo e um negativo aplicavel.
2. Concorrencia e constraints sao provadas em Postgres production-like.
3. Testes falham ao remover filtro de tenant, estado APPROVED ou capacidade minima.
4. Fixtures sao sinteticas, deterministicas e sem segredo/PII real.

## Validacao
- comandos/checks: suites focadas API/Shared, integracao Postgres e `npm run repo:hygiene`.
- revisao manual: matriz requisito -> teste -> evidencia.

## Riscos
- Mocks permissivos esconderem constraint ou isolamento real.

## Proximo passo provavel
TASK-AT-385

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nao substituir teste production-like de concorrencia por mock.
