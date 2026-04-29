# TASK-QLT-001 - Gates minimos de qualidade

## Metadata
- status: proposed
- owner: quality-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-QLT-001-gates-minimos-qualidade.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_orchestrator`
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Materializar typecheck, lint, test runner e scripts padrao antes das features.

## Dependencias
- satisfeitas: `TASK-SCF-001`
- em aberto: n/a

## Alvos explicitos
1. configs de lint/typecheck/test
2. scripts `check`, `test`, `lint`, `typecheck`

## Fora de escopo
- coverage alto obrigatorio
- E2E completo

## Acceptance Criteria
1. `npm run check` executa gates minimos.
2. Falhas de lint/typecheck quebram o gate.
3. Existe teste smoke inicial.

## Validacao
- `npm run check`

## Riscos
- configurar ferramenta demais antes do dominio
