# TASK-QLT-002 - Baseline de lint executavel

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-23
- source-of-truth: docs/tasks/TASK-QLT-002-baseline-lint-executavel.md

## Modo
- mode: quality
- generation-mode: pipeline kickoff

## Capability
- formalizacao transversal de engenharia

## Objetivo unico
Materializar baseline minima de lint para TypeScript nos workspaces com validacao executavel no root.

## Contexto minimo
O baseline de typecheck ja esta verde; falta o gate minimo de lint para completar o bloco inicial de qualidade sem abrir funcionalidade.

## Dependencias
- satisfeitas:
  - TASK-QLT-001 concluida
  - lockfile e dependencias basicas existentes
- em aberto:
  - nenhuma critica para esta task

## Alvos explicitos
1. package.json
2. .eslintrc.cjs
3. .eslintignore
4. docs/tasks/TASK-QLT-002-execution.md
5. docs/tasks/TASK-QLT-002-verification.md
6. docs/operations/taskyfier-memory.md
7. docs/operations/orchestrator-state.md
8. docs/operations/quality-builder-state.md
9. docs/operations/task-verifier-state.md

## Fora de escopo
- implementacao funcional de produto
- refatoracao de arquitetura
- lint de arquivos fora de apps/services/packages

## Acceptance Criteria
1. `npm run lint` existe no root e executa lint em `apps`, `services` e `packages`.
2. Config ESLint para `.ts` materializada no repositorio.
3. Execucao de `npm run lint` registrada com resultado observavel.
4. Ciclo finalizado com execution e verification reports.

## Validacao
- comandos/checks:
  - `test -f .eslintrc.cjs`
  - `test -f .eslintignore`
  - `npm run lint`

## Evidencia esperada
- artefatos de lint no repo
- output de lint registrado no execution report

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- task_package: TASK-QLT-002
- constraints:
  - sem escopo funcional novo
  - manter compact docs-first mode
