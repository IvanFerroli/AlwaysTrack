# TASK-AT-031 - Wiki document renderer

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-031-wiki-document-renderer.md

## Objetivo
Renderizar paginas da Wiki como documentos operacionais bonitos, legiveis e seguros.

## Escopo
- Renderizar Markdown seguro para headings, listas, checklist, tabelas, links, imagens, codigo, quote e divisorias.
- Tipografia de documento para leitura longa.
- Links externos com atributos seguros.
- Tabelas responsivas.
- Sumario por headings quando fizer sentido.

## Aceite
- Conteudo publicado nao parece bloco de texto puro.
- Tabelas e listas ficam legiveis em desktop e mobile.
- Links externos nao executam scripts e abrem com seguranca.
- Preview de revisao usa o mesmo renderer da pagina publicada.

## Riscos
- Sanitizacao incompleta.
- CSS de documento vazar para telas operacionais.
- Tabelas largas podem quebrar layout mobile.
