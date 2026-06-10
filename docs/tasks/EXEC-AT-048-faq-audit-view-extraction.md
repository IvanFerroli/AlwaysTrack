# EXEC-AT-048 - Extracao de FAQ e Auditoria

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-10
- parent-task: TASK-AT-054-code-hardening-modularization-rounds.md

## Objetivo
Continuar a modularizacao frontend extraindo views com fronteira clara de `apps/web/src/main.tsx`.

## Entrega
- Extraida a view de FAQ/threads para `apps/web/src/views/faq.tsx`.
- Extraida a view de Auditoria para `apps/web/src/views/audit.tsx`.
- Encapsulados na view de Auditoria os filtros, tipos e redaction de metadados sensiveis.
- Reduzido `apps/web/src/main.tsx` para 6768 linhas.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`
