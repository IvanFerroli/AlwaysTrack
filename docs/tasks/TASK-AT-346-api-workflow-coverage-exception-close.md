# TASK-AT-346 - API coverage: workflows e encerramento da excecao de funcoes

## Metadata
- status: completed-local-validation
- owner: api/core
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-346-api-workflow-coverage-exception-close.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Restaurar o piso de 75% de funcoes da API antes do vencimento da excecao em 2026-08-15.

## Dependencias
- TASK-AT-345.

## Escopo
- Fluxos de Atendimento: create, update, publish, archive, restore, sessao, role e tenant.
- Handlers de sales documents, Scriptoteca, Wiki e CaseFlow.
- Jobs de notificacao, ranking e privacidade; entrypoints e shutdown.

## Acceptance Criteria
1. `service-flows.service.ts` cobre lifecycle, sessao, restauracao e isolamento organizacional.
2. Jobs cobrem idempotencia, falha parcial, retry e encerramento.
3. Funcoes globais e threshold API chegam a pelo menos 75%.
4. Excecao temporaria e encerrada formalmente na politica.
5. Smokes Google/Meta permanecem fake e sem credenciais.

## Validacao
- coverage API repetido, handlers HTTP, jobs, lifecycle, OpenAPI e build.

## Resultado
- Lifecycle de Fluxos cobre listagem por tenant/role, sessao, atualizacao, conclusao e restauracao versionada; `service-flows.service.ts` atingiu 88.37% de funcoes.
- Handlers de Fluxos, documentos comerciais, Scriptoteca e Wiki atingiram 100% de funcoes com HTTP fake e fixtures sanitizadas.
- Suite API: 633 testes aprovados e 1 Redis opt-in ignorado; build e typecheck aprovados.
- Coverage API: 77.64% de linhas/statements, 66.40% de branches e 79.23% de funcoes.
- Piso global de funcoes restaurado para 75% e excecao temporaria encerrada antes do prazo.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: atacar por risco e quantidade descoberta, sem teste de import vazio.
- constraints: fixtures locais/sanitizadas e nenhuma integracao live.
