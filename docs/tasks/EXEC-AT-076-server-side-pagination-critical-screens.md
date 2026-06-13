# EXEC-AT-076 - Paginacao server-side em telas criticas

## Metadata
- status: completed-critical-screens
- owner: codex
- last-updated: 2026-06-13
- task: docs/tasks/TASK-AT-076-server-side-pagination-critical-screens.md

## Escopo executado
- Notas/DANFEs: `/v1/sales/documents` aceita `page`/`pageSize`, aplica `skip`/`take` e a tela deixou de paginar com `slice`.
- Extratos: `/v1/sales/statements` retorna consolidado global do filtro, mas `items` paginados com `itemsTotal`, `page` e `pageSize`.
- Wiki: `/v1/wiki/pages` aceita `page`/`pageSize` e a tela usa pagina remota para busca/tag/status/recencia.
- FAQ: itens publicos/admin e threads aceitam `page`/`pageSize`; a tela de threads usa pagina remota para filtros principais.
- Auditoria ja estava server-side (`page`, `pageSize`, `total`) e foi mantida sem alteracao.

## Fora de escopo deliberado
- Scriptoteca nao foi tocada.
- O atalho local da FAQ "Sem resposta" permanece derivado da pagina carregada, porque nao existe filtro backend especifico para threads abertas sem comentarios.
- Wiki discovery chips e contadores auxiliares refletem a pagina filtrada atual; o total da lista usa o `total` da API.

## Validacao
- `npm run typecheck --workspaces --if-present`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts wiki.service.test.ts faq.service.test.ts`

## Risco residual
- Filtros derivados por agregacao, como "Sem resposta", ainda merecem endpoint dedicado se virarem requisito de escala/metricas.
