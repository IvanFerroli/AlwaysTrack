# EXEC-AT-014 - Wiki discovery and review digest

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-014-wiki-discovery-review.md

## Objetivo
Avancar a Wiki como area apresentavel de procedimentos, melhorando descoberta de paginas e dando mais seguranca para admin revisar propostas formatadas.

## Entregue
- `AT-035` concluida como MVP com mapa da Wiki, recentes, pendencias, estatisticas, tags derivadas de `#tags` e filtro local por tag.
- API passa a devolver `tags` junto de paginas e edit requests, mantendo o formato Markdown sem migration adicional.
- Lista lateral destaca paginas recentes, arquivadas, pendentes e tags.
- `AT-033` avancada parcialmente com digest de linhas adicionadas/removidas em comparacao de revisoes e preview de requisicao.
- Preview de requisicao alerta quando a pagina atual esta em versao diferente da `baseVersion` da proposta.

## Validacao
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`

## Residual
- `AT-032`: imagens/anexos persistidos para Wiki.
- `AT-033`: diff mais granular e conflito com tres paineis mesmo sem pagina aberta.
- Taxonomia administravel sem editar conteudo depende de futura migration de categorias/tags/pin.
