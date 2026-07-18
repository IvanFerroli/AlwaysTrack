# TASK-AT-388 - Documentacao de produto, dados, API e operacao SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-388-sac-product-data-api-operations-docs.md

## Modo
- mode: documentation

## Objetivo unico
Documentar contratos, formulas, permissoes, fluxos e procedimentos operacionais da transformacao SAC sem contradizer o runtime.

## Contexto minimo
A frente altera conceitos centrais e desativa documentacao comercial existente. Ajuda obsoleta pode reabrir operacao retirada ou ensinar agregacao incorreta.

## Dependencias
- satisfeitas: TASK-AT-381, TASK-AT-383, TASK-AT-386 e TASK-AT-387.
- em aberto: resultados do ensaio de rollout entram na TASK-AT-389.

## Alvos explicitos
1. Arquitetura/domains e dicionario de metricas.
2. Matriz RBAC, OpenAPI e ajuda operacional.
3. Runbooks de pausas, performance, campanhas, legado e incidente.

## Fora de escopo
- Marcar validacao live sem evidencia.
- Manter tutorial ativo de Notas/Ranking/Extratos.

## Checklist
1. Explicar capacidade, swap, override e overlap.
2. Explicar formulas, estados, revisoes e dado ausente.
3. Explicar campanhas sem ranking e provenance de resultados.
4. Catalogar flags, deprecacao, exportacao legada e troubleshooting.
5. Atualizar comandos, diagramas, links, ownership e glossario.

## Acceptance Criteria
1. Operador consegue diagnosticar conflito, breach, lote rejeitado e numero divergente.
2. API e exemplos refletem contratos reais e roles autorizadas.
3. Busca documental ativa nao recomenda fluxo comercial aposentado.
4. `check:docs` passa sem excecao nova injustificada.

## Validacao
- comandos/checks: `npm run check:docs`, contract tests e `git diff --check`.
- revisao manual: walkthrough por operador que nao implementou a feature.

## Riscos
- Duplicar fonte de formula entre docs, Shared e service.

## Proximo passo provavel
TASK-AT-389

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: docs atualizadas no mesmo commit das mudancas de contrato finais.
