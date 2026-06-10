# EXEC-AT-049 - Extracao de Usuarios/Times

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-10
- parent-task: TASK-AT-054-code-hardening-modularization-rounds.md

## Objetivo
Continuar a modularizacao frontend removendo a tela administrativa comercial de `apps/web/src/main.tsx`.

## Entrega
- Extraida a view de Usuarios/Times para `apps/web/src/views/users-teams.tsx`.
- Encapsulados na view os tipos comerciais locais, formatacao de telefone, labels de role e payload de usuario/vendedor/supervisor.
- Reduzido `apps/web/src/main.tsx` para 6356 linhas.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`
