# TASK-AT-118 - `npm run up` como bancada de estudo local

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-118-local-up-study-workbench.md

## Objetivo unico
Fazer o startup local abrir automaticamente os principais pontos de estudo do projeto.

## Entrega
- `npm run up` gera TypeDoc por padrao.
- Abre Web, API health, Prisma Studio, TypeDoc, docs de testes, docs de carga e relatorios locais existentes.
- Flags preservadas: `--no-open`, `--no-studio`; adicionada `--no-docs`.

## Acceptance Criteria
1. `npm run up` continua subindo API/Web/Studio.
2. Documentacao abre no navegador quando gerada.
3. O fluxo pode ser reduzido com `--no-open` ou `--no-docs`.
