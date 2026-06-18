# EXEC-AT-101 - Anexos de imagem transversais em conteudo operacional

## Resultado
- status: completed-mvp-slice
- date: 2026-06-18
- task: docs/tasks/TASK-AT-101-rich-image-attachments-across-content.md

## Entrega
Criado slice MVP para reaproveitar o upload de imagem da Wiki nos principais conteudos operacionais sem criar um segundo fluxo de anexos.

## Escopo coberto
1. Extraido editor/renderer Markdown compartilhado para `apps/web/src/components/markdown-editor.tsx`.
2. Wiki passou a consumir o componente compartilhado sem mudar o comportamento existente.
3. FAQ ganhou upload/preview/render de imagem no contexto da pergunta e respostas.
4. Avisos ganharam upload/preview/render de imagem no conteudo do comunicado.
5. Scriptoteca ganhou upload/preview/render de imagem no corpo do script e sugestoes.
6. Documentada a decisao em `docs/architecture/rich-content-images.md`.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- Remocao visual/auditavel de arquivos nao foi criada; remover a linha Markdown remove a imagem do conteudo, mas o arquivo permanece no storage.
- O backend ainda usa `WikiAttachment` como mecanismo compartilhado; se o volume crescer, criar entidade generica de anexo operacional.
- Nao foram adicionadas seeds com imagens para evitar inflar repositorio e storage local.
