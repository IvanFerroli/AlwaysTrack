# EXEC-SCR-019 - Coletor RSS generico por seed list

## Metadata
- task-id: TASK-SCR-019
- execution-id: EXEC-SCR-019
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Novo fluxo `source=rss-seed` para coleta RSS multi-feed.
2. Suporte a seed list via `rssSeeds` (runtime/query) e `SCRAPER_RSS_SEEDS`.
3. Alias operacionais adicionados: `genericrss` e `generic-rss`.
4. Report por seed em `sourceReports` com `method=rss`.
5. Fetch RSS robustecido com fallback basico para estruturas Atom-like (`entry`).

## Arquivos alterados
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.handlers.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `docs/runbooks/README.md`
- `docs/specs/SPEC-003-job-scraping.md`

## Evidencias materiais
- collector RSS generico operacional com multiplos feeds.
- testes novos para sucesso multi-feed, aliases e erro de seed invalida.
- report consolidado e por seed com contadores coerentes.

## Riscos e ressalvas
- seed list default pode incluir feed instavel no ambiente local.
- feeds muito custom podem parsear parcialmente e gerar mais warnings.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
