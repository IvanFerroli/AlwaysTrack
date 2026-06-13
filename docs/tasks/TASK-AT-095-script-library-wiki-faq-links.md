# TASK-AT-095 - Scriptoteca: vinculos com Wiki e FAQ

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-095-script-library-wiki-faq-links.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.7
- dependencias: `TASK-AT-090`, Wiki/FAQ existentes.

## Objetivo unico
Conectar scripts a paginas Wiki e threads FAQ sem confundir os dominios.

## Escopo funcional
1. Script pode apontar para Wiki relacionada.
2. Script pode apontar para FAQ relacionada.
3. Wiki pode listar scripts relacionados se viavel.
4. FAQ resolvida pode sugerir criacao de script.
5. Documentar diferenca: Wiki = procedimento, FAQ = pergunta, Scriptoteca = texto pronto.

## Acceptance Criteria
1. Usuario abre Wiki/FAQ relacionada a partir do script.
2. Vinculos respeitam permissao de leitura.
3. Script nao duplica conteudo completo de Wiki por padrao.
4. Backlinks aparecem onde fizer sentido.
5. Documentacao explica o uso correto.

## Riscos
- Transformar tudo em tudo e perder clareza de produto.
- Vinculos quebrados apos arquivamento.
