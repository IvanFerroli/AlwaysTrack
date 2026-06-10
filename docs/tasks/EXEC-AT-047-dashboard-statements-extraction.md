# EXEC-AT-047 - Extracao de Dashboard e Extratos

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-10
- parent-task: TASK-AT-054-code-hardening-modularization-rounds.md

## Objetivo
Continuar a rodada de modularizacao frontend removendo mais UI operacional de `apps/web/src/main.tsx` sem alterar comportamento de produto.

## Entrega
- Extraida a view de Dashboard para `apps/web/src/views/dashboard.tsx`.
- Extraida a view de Extratos para `apps/web/src/views/statements.tsx`.
- Centralizados contratos comerciais reutilizados por Notas, Dashboard e Extratos em `apps/web/src/sales.ts`.
- Reduzido `apps/web/src/main.tsx` para 7244 linhas.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`
