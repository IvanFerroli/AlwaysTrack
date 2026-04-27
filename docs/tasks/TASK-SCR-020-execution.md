# EXEC-SCR-020 - Discovery via sitemap de paginas de carreira

## Metadata
- task-id: TASK-SCR-020
- execution-id: EXEC-SCR-020
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Novo modo `source=sitemap-discovery` no scraper para discovery controlado por seed.
2. Entrada via `sitemapSeeds` (query/runtime) e `SCRAPER_SITEMAP_SEEDS` (env).
3. Extração de URLs de `urlset` e `sitemapindex` com limite de volume e falha parcial resiliente.
4. Sugestoes candidatas persistidas de forma auditavel em `memory-entries` com chave `discovery:sitemap:*`.

## Arquivos alterados
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.handlers.ts`
- `services/api/src/features/ingestion/ingestion.service.ts`
- `services/api/src/features/pipeline/pipeline.service.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `docs/specs/SPEC-003-job-scraping.md`
- `docs/runbooks/README.md`

## Evidencias materiais
- `runScraper(sitemap-discovery)` com report por seed (`method=sitemap`).
- testes cobrindo sucesso de discovery e erro de seed invalida.
- trilha auditavel em memoria runtime para URLs candidatas descobertas.

## Riscos e ressalvas
- quality de URL descoberta depende de sitemap de origem.
- variação de schema XML entre sites pode reduzir cobertura de discovery.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
