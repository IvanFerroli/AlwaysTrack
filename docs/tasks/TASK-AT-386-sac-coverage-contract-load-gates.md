# TASK-AT-386 - Coverage, contratos, carga e gates SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-386-sac-coverage-contract-load-gates.md

## Modo
- mode: verification

## Objetivo unico
Integrar a frente aos gates de coverage, OpenAPI, performance, documentacao e qualidade sem reduzir thresholds existentes.

## Contexto minimo
Suites focadas nao garantem que novos arquivos participem do gate raiz, que Web/API nao tenham drift ou que disputa de slots suporte carga representativa.

## Dependencias
- satisfeitas: TASK-AT-383, TASK-AT-384 e TASK-AT-385.
- em aberto: ambiente production-like para carga e soak.

## Alvos explicitos
1. Coverage por workspace/modulos SAC e politica de risco.
2. OpenAPI e contract tests de consumidores Web.
3. Carga de leitura, booking concorrente, importacao e dashboards.

## Fora de escopo
- Reduzir threshold para obter verde.
- Chamar smoke local de capacidade de producao.

## Checklist
1. Incluir novos modulos nos reports e thresholds incrementais.
2. Versionar schemas de erro, paginacao, filtros e deprecacao legada.
3. Testar burst na ultima vaga, swaps, import batches e series longas.
4. Medir p95/p99, conflitos esperados, erro, pool e query plans.
5. Rodar `check`, docs, hygiene e builds de todos os workspaces afetados.

## Acceptance Criteria
1. Linhas/branches criticos de capacidade, RBAC e formulas atingem threshold definido.
2. Contrato falha com drift entre API e Web.
3. Carga nao viola capacidade nem duplica entrada idempotente.
4. Relatorio classifica ambiente, massa, commit e limites da evidencia.

## Validacao
- comandos/checks: `npm run check`, `npm run coverage:check`, `npm run check:docs`, carga production-like e `git diff --check`.
- revisao manual: coverage de branches criticos e relatorio de performance.

## Riscos
- Meta percentual alta em arquivo simples distrair de branch de concorrencia nao coberto.

## Proximo passo provavel
TASK-AT-387

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: manter classificacao de evidencia e thresholds existentes.
