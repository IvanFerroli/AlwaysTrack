# TASK-AT-030 - Wiki rich editor

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-030-wiki-rich-editor.md

## Objetivo
Substituir o textarea da Wiki por um editor confortavel, com toolbar e liberdade real de formatacao.

## Caminho recomendado
Implementar uma primeira versao Markdown com toolbar propria e preview renderizado. Se a experiencia ainda ficar aquem, evoluir para Tiptap com schema controlado.

## Escopo
- Toolbar para titulos, negrito, italico, listas, checklist, citacao, codigo, link, tabela simples e divisoria.
- Aplicar o mesmo editor em criacao, edicao admin e sugestao de nao-admin.
- Preservar rascunho local.
- Manter fluxo de aprovacao existente.

## Entregue
- Editor Markdown com toolbar propria em criacao, edicao admin e sugestao de nao-admin.
- Abas Escrever/Preview usando o mesmo renderer da leitura publicada.
- Rascunho local continua funcionando com conteudo formatado.

## Aceite
- Admin cria e publica pagina formatada.
- Usuario nao-admin envia proposta formatada para aprovacao.
- Rascunho local preserva conteudo formatado.
- Preview mostra a formatacao antes de publicar/enviar.
- Mobile continua usavel.

## Residual
- `apps/web/src/main.tsx` ja esta grande; ideal extrair componentes de Wiki durante a implementacao.
- Toolbar ainda e Markdown-first, nao WYSIWYG completo.
- Imagens com upload local ficam em `AT-032`.
