# EXEC-AT-052 - Wiki and notification modularization

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-054

## Objetivo
Remover mais dominios ativos de `apps/web/src/main.tsx` sem alterar comportamento.

## Entregas
- `WikiView` extraida para `apps/web/src/views/wiki.tsx`.
- `NotificationCenter` extraido para `apps/web/src/components/notification-center.tsx`.
- Imports do shell principal simplificados.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`

## Residual
Proxima rodada de hardening deve focar hooks/API clients tipados, padronizacao de erros e services backend.
