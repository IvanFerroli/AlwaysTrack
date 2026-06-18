# EXEC-AT-131 - Fluxos de atendimento com editor rico tipo Wiki

## Resultado
- status: completed-mvp
- date: 2026-06-18
- task: docs/tasks/TASK-AT-131-service-flow-rich-wiki-editor.md

## Entrega
O cadastro de Fluxos passou a reutilizar `MarkdownEditor` no conteúdo de apoio do fluxo e na orientação de cada etapa, com preview e upload de imagem via mecanismo existente da Wiki.

## Arquivos
- `apps/web/src/views/service-flows.tsx`

## Validação
- `npm run typecheck --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- O backend ainda armazena o conteúdo como markdown simples; governança/versionamento rico fica em `TASK-AT-135`.
