# TASK-AT-341 - Web coverage: operacao, Fluxos e CaseFlow em 30%

## Metadata
- status: planned
- owner: web/product
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-341-web-operational-caseflow-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Cobrir as superficies operacionais demonstradas e fechar o terceiro marco Web.

## Dependencias
- TASK-AT-340.

## Escopo
- Dashboard, Fluxos de Atendimento, CaseFlow health/admin e estados de conectores.
- Edicao/publicacao de fluxo, conflito, rollback de UI e sessao guiada.
- Loading, vazio, timeout, degradacao, retry e role sem permissao.

## Acceptance Criteria
1. Jornada vertical da demo possui coverage de componente alem do E2E.
2. `service-flows.tsx` e `case-flow/health.tsx` deixam 0% com branches negativos.
3. Web atinge pelo menos 30% de linhas, 60% de branches e 45% de funcoes.
4. Thresholds globais e criticos sobem sem excluir fontes.

## Validacao
- coverage Web, E2E CaseFlow, acessibilidade, visual desktop/mobile e build.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: proteger estados internos que o E2E nao atribui ao V8.
- constraints: conectores fake/local e nenhuma credencial.
