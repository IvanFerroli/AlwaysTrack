# SPEC-003 - Job Scraping

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-003-job-scraping.md

## Objetivo unico
Executar coleta multi-fonte com tolerancia a falha parcial e report por fonte.

## Fronteira
- inclui: `POST /v1/scraper/run` e runner/fetcher/parser.
- nao inclui: ranking final e aprovacao de candidatura.

## Contrato observavel
- entrada: query params `source`, `keyword`, `autoDiscard`, `rssSeeds` (quando `source=rss-seed`) e `sitemapSeeds` (quando `source=sitemap-discovery`).
- saida: `ApiResult` com contadores (`fetched`, `parsed`, `ingested`, `deduplicated`, `autoDiscarded`) e `sourceReports`.
- matriz de modo por fonte: `auto | fallback | blocked`.

## Limites
- `autoDiscard` e opt-in (`false` por padrao).
- falha de fonte nao deve quebrar rodada `source=all`.
- fontes externas podem oscilar por timeout/security-check.

## Observabilidade minima
- `sourceReports` com `method` canonico por fonte, `mode`, `latencyMs`, `failureType`, `errors`.
- `keywordRequested` e `keywordEffective` em rodada.

## Acceptance Criteria
1. `source=all` retorna consolidado mesmo com falha parcial.
2. `sourceReports` mostra modo efetivo e metodo canonico por fonte.
3. `source=cryptojobslist` executa caminho RSS em `auto`.
4. `source=rss-seed` processa multiplos feeds RSS em uma rodada.
5. `source=sitemap-discovery` gera sugestoes auditaveis de URLs candidatas sem promover fonte automaticamente.

## Definition of Done
1. Runner cobre fonte unica e all com contadores coerentes.
2. Testes incluem parsing e falha parcial controlada.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- revisao manual:
  - executar `/v1/scraper/run?source=all` e validar `sourceReports`.

## Evidencia esperada
- payload com `sourceReports` por fonte.
- cenario de falha parcial com ciclo concluido.

## Riscos e mitigacao
- risco: bloqueios externos em fontes publicas.
- mitigacao: fallback controlado e classificacao de falha por fonte.
