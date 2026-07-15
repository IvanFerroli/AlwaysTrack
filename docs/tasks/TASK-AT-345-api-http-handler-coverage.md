# TASK-AT-345 - API coverage: harness HTTP e funcoes de handlers

## Metadata
- status: completed-local-validation
- owner: api/core
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-345-api-http-handler-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Remover a primeira metade da divida de funcoes por meio de um harness HTTP reutilizavel.

## Dependencias
- TASK-AT-316 e TASK-AT-337.

## Escopo
- Harness alinhado ao OpenAPI para auth, organizacoes, usuarios, notificacoes e handlers P0.
- Sucesso, validacao, autorizacao, erro de service e traducao para envelope HTTP.
- Contadores de branch sem itens instrumentados devem permanecer `N/A`.

## Acceptance Criteria
1. Handlers priorizados deixam 0% de funcoes com assertions de status e envelope.
2. Funcoes globais API chegam a pelo menos 70% e threshold sobe a 68%.
3. Linhas e branches nao regridem; nenhum teste apenas importa modulo.
4. Tenant e roles possuem casos negativos explicitos.

## Validacao
- coverage API, OpenAPI contract, auth/tenancy e build API.

## Resultado
- Harness HTTP reutilizavel aplicado a auth, organizacoes, usuarios, notificacoes e relatorios.
- 81 cenarios HTTP novos cobrem sucesso, validacao, autorizacao e traducao de erros sem Prisma, providers ou rede reais.
- Coverage API: 71.52% de linhas/statements, 67.58% de branches e 70.34% de funcoes.
- Piso global de funcoes elevado de 64% para 68%.
- Suite completa: 539 testes aprovados e 1 ignorado; OpenAPI/auth/tenancy, build e typecheck aprovados.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: criar harness uma vez e migrar handlers em slices revisaveis.
- constraints: Prisma/providers mockados no limite correto, sem rede externa.
