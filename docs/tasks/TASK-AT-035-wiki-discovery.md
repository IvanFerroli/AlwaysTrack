# TASK-AT-035 - Wiki discovery

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-035-wiki-discovery.md

## Objetivo
Melhorar navegacao e descoberta de conteudo na Wiki conforme o volume de paginas crescer.

## Escopo
- Categorias ou tags.
- Paginas fixadas.
- Recentemente atualizadas.
- Busca com filtros.
- Indicadores de pendencia/revisao na lista.

## Aceite
- Usuario encontra pagina por categoria/tag.
- Lista lateral destaca paginas pendentes ou atualizadas recentemente.
- Admin consegue organizar conteudo sem mexer no corpo da pagina.
- Regras de role ficam alinhadas entre API e navegacao.

## Entregue no MVP
- API retorna `tags` derivadas de `#tags` no conteudo Markdown, sem migration inicial.
- Wiki mostra mapa com paginas recentes, paginas com pendencia e estatisticas de ativas/arquivadas.
- Lista lateral destaca recentes, arquivadas, pendentes e tags por pagina.
- Usuario filtra localmente por tag clicando nos chips.
- Regras de pagina ativa/arquivada continuam aplicadas pela API conforme role.

## Residual
- Categorias/paginas fixadas persistidas ainda precisam de migration propria se a operacao demandar taxonomia administravel sem editar conteudo.
- Busca por tag ainda e derivada do conteudo carregado, nao um indice dedicado.

## Riscos
- Taxonomia virar trabalho manual demais.
- Divergencia entre roles comerciais e roles legadas.
- Tags/categorias exigirem migration e seed cuidadosos.
