# EXEC-AT-051 - Help view extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-10
- source-task: `TASK-AT-054-code-hardening-modularization-rounds.md`

## Objetivo
Continuar a modularizacao controlada do frontend extraindo apenas a tela `Como usar` do `apps/web/src/main.tsx`.

## Entrega
- Criado `apps/web/src/views/help.tsx` com a `HelpView` e seu conteudo operacional.
- `apps/web/src/main.tsx` passou a importar `HelpView`, reduzindo o tamanho do shell principal sem mudar comportamento.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`
- `git diff --check`

## Risco residual
- Mudanca estrutural de baixo risco. O risco residual e visual/ancoras de ajuda, por isso a proxima rodada Playwright de navegador deve cobrir navegacao por `#anchors` do Como usar.
