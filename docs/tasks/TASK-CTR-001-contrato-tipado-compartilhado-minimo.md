# TASK-CTR-001 - Contrato tipado compartilhado minimo

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-CTR-001-contrato-tipado-compartilhado-minimo.md

## Modo
- mode: contracts
- generation-mode: pipeline kickoff

## Capability
- formalizacao transversal de engenharia

## Objetivo unico
Estabilizar um contrato tipado minimo compartilhado entre workspaces via `@olympus/shared-types`, sem abrir implementacao funcional.

## Contexto minimo
Os workspaces ja possuem scaffold e quality baseline. Falta reativar compartilhamento de tipo com contrato minimo e validacao executavel.

## Dependencias
- satisfeitas:
  - TASK-SCF-001 concluida
  - TASK-QLT-001 concluida
  - TASK-QLT-002 concluida
- em aberto:
  - nenhuma critica para esta task

## Alvos explicitos
1. packages/shared-types/package.json
2. apps/web/src/main.ts
3. services/api/src/main.ts
4. docs/tasks/TASK-CTR-001-execution.md
5. docs/tasks/TASK-CTR-001-verification.md
6. docs/operations/taskyfier-memory.md
7. docs/operations/orchestrator-state.md
8. docs/operations/contracts-builder-state.md
9. docs/operations/task-verifier-state.md

## Fora de escopo
- logica funcional de produto
- integracoes
- runtime real entre modulos
- expansao de dominio de contratos

## Acceptance Criteria
1. `apps/web` e `services/api` usam `import type` de `@olympus/shared-types`.
2. `npm run lint` e `npm run typecheck` passam apos o ajuste.
3. Nenhum comportamento funcional de produto e adicionado.
4. Execution/verification reports materializados.

## Validacao
- comandos/checks:
  - `rg -n "@olympus/shared-types" apps/web/src/main.ts services/api/src/main.ts`
  - `npm run lint`
  - `npm run typecheck`

## Evidencia esperada
- import tipado compartilhado materializado nos dois entrypoints
- gates de quality verdes

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- task_package: TASK-CTR-001
- constraints:
  - sem escopo funcional novo
  - manter compact docs-first mode
