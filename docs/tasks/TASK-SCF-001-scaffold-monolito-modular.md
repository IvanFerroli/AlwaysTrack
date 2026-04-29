# TASK-SCF-001 - Scaffold do monolito modular

## Metadata
- status: proposed
- owner: scaffolding-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-SCF-001-scaffold-monolito-modular.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_orchestrator`
- `olympus_contracts_builder`
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Criar a estrutura base React/Vite + Express/TypeScript + packages compartilhados, pronta para modulos internos.

## Inputs
- documento central, secoes 3, 4, 12 e 17

## Dependencias
- satisfeitas: `TASK-DOC-001`
- em aberto: n/a

## Alvos explicitos
1. `apps/web/`
2. `services/api/`
3. `packages/shared/`
4. `package.json`
5. `tsconfig.base.json`

## Fora de escopo
- implementar features de dominio
- deploy em producao

## Acceptance Criteria
1. Web e API sobem localmente.
2. Estrutura separa `core/` e `modules/`.
3. Shared package exporta contratos basicos.

## Validacao
- `npm install`
- `npm run dev`
- `npm run check`

## Riscos
- scaffold virar arquitetura complexa demais
- acoplamento prematuro entre web e API
