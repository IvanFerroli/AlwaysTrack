# TASK-RTM-001 - Bootstrap de runtime local

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-RTM-001-bootstrap-runtime-local.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- formalizacao transversal de engenharia

## Objetivo unico
Materializar bootstrap de runtime local para `web` e `api` com execucao observavel, sem depender de integracoes externas.

## Contexto minimo
Scaffold, quality baseline e contrato tipado minimo ja existem; faltava capacidade de subir runtime local previsivel para avançar desenvolvimento.

## Dependencias
- satisfeitas:
  - TASK-SCF-001
  - TASK-QLT-001
  - TASK-QLT-002
  - TASK-CTR-001
- em aberto:
  - spec minima para primeira logica funcional de produto

## Alvos explicitos
1. package.json
2. tsconfig.base.json
3. apps/web/src/main.ts
4. apps/web/tsconfig.json
5. services/api/src/main.ts
6. services/api/tsconfig.json
7. packages/shared-types/src/index.ts
8. docs/tasks/TASK-RTM-001-execution.md
9. docs/tasks/TASK-RTM-001-verification.md

## Fora de escopo
- regra de negocio de produto
- persistencia de dados
- integracao com servicos externos

## Acceptance Criteria
1. Scripts `dev:web`, `dev:api` e `dev` existem no root.
2. API responde `GET /health` em runtime local.
3. Web responde HTML em runtime local.
4. `npm run lint` e `npm run typecheck` passam apos alteracoes.

## Validacao
- comandos/checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run dev:api` + `curl http://127.0.0.1:3001/health`
  - `npm run dev:web` + `curl http://127.0.0.1:3000`

## Evidencia esperada
- resposta JSON da API de health
- resposta HTML do web scaffold
- gates de quality verdes

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- task_package: TASK-RTM-001
- constraints:
  - manter aderencia ao canônico
  - manter compact docs-first mode
