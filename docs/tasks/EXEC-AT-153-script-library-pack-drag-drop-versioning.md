# EXEC-AT-153 - Drag/drop de scripts em roteiros da Scriptoteca

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-153-script-library-pack-drag-drop-versioning.md
- completed: 2026-06-19

## Entrega
- Adicionado drag/drop nativo no construtor de pacotes da Scriptoteca.
- Mantidos controles por botoes para reordenacao acessivel.
- O reorder altera `packDraft.scriptIds`, reaproveitando a persistencia existente do pacote.
- Adicionado estado visual `dragging`.

## Arquivos
- `apps/web/src/views/script-library.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

## Risco residual
- Playwright visual nao foi rodado por limitacao ambiental conhecida do Chromium local (`libnspr4.so`).
