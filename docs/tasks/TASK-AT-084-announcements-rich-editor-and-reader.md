# TASK-AT-084 - Avisos: editor rico e leitura

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-084-announcements-rich-editor-and-reader.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.2
- dependencias: `TASK-AT-083`, Wiki rica existente.

## Objetivo unico
Criar a experiencia visual de Avisos com editor rico semelhante ao da Wiki e leitura clara para todos os usuarios.

## Escopo funcional
1. Nova aba `Avisos` no menu lateral e atalhos do topo.
2. Lista com filtros por status, prioridade, vigencia, tag e texto.
3. Editor com titulo, slug, resumo, conteudo markdown/estruturado, tags e preview.
4. Detalhe de aviso com renderizacao rica, autor, data de publicacao, validade e links relacionados.
5. Estados vazios e vencidos claros.
6. Reaproveitar componentes da Wiki onde fizer sentido.

## Acceptance Criteria
1. Admin/Gestor/Supervisor autorizado cria e edita aviso sem sair da tela.
2. Usuario comercial le avisos publicados em layout limpo.
3. Conteudo aceita headings, listas, links e destaque suficiente para comunicado operacional.
4. Build web passa e nao cria duplicacao desnecessaria de componentes Wiki.

## Riscos
- Editor rico virar fork da Wiki; preferir extrair/reusar helpers comuns.

