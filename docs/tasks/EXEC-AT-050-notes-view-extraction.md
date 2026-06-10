# EXEC-AT-050 - Notes view extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-10
- source-task: `TASK-AT-054-code-hardening-modularization-rounds.md`

## Objetivo
Continuar a rodada de hardening modular extraindo a tela de Notas do `apps/web/src/main.tsx`.

## Entrega
- Criado `apps/web/src/views/notes.tsx` com a UI de upload, filtros, revisão, seleção em lote, reprocessamento e dados extraídos.
- Movidos helpers locais de revisão de DANFE para o módulo de Notas.
- `apps/web/src/main.tsx` passou a importar `NotesView`, reduzindo o acoplamento do shell principal.

## Validação
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`
- `git diff --check`

## Risco residual
- Mudança estrutural sem alteração intencional de comportamento. Regressão mais provável seria visual/fluxo na tela de Notas, coberta por typecheck/build e recomendada para a próxima rodada Playwright de navegador.
