# TASK-SCR-006 - Platform sources LinkedIn e Gupy

## Metadata
- id: TASK-SCR-006
- titulo: Adicionar fontes de plataforma ao scraper com persistencia Postgres
- capability: job-scraping
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-25
- source-of-truth: code + local gates + Postgres smoke

## Objetivo unico
Permitir que o scraper traga vagas de plataformas padrao usando fontes publicas/assistidas, preservando a origem da plataforma em `sourceName` e persistindo pelo pipeline existente no Postgres.

## Escopo implementado
- Fonte `linkedin` via LinkedIn public guest search HTML.
- Fonte `gupy` via Gupy public portal JSON.
- `source=all` passa a incluir LinkedIn e Gupy.
- `sourceName` das vagas ingeridas fica como `LinkedIn` ou `Gupy`.
- UI do Dashboard ganhou seletor de source para rodar scraper por plataforma.
- Indeed e Glassdoor foram nomeados como fontes conhecidas, mas indisponiveis no runner automatico atual por security check.

## Fora de escopo
- Login, bypass de anti-bot, captcha ou scraping autenticado.
- Browser agent/headless crawler persistente.
- Envio automatico de candidatura.

## Evidencia
- `npm run typecheck` passou.
- `npm run lint` passou.
- `npm test --workspace @olympus/api` passou com 52 testes.
- Smoke Postgres com keyword `node`:
  - LinkedIn: fetched 9, ingested 9, deduplicated 0.
  - Gupy: fetched 3, ingested 3, deduplicated 0.
- Consulta Postgres confirmou vagas persistidas agrupadas por `sourceName`: LinkedIn 9, Gupy 3.

## Riscos remanescentes
- LinkedIn guest search e Gupy public portal sao fontes externas e podem mudar formato/limite.
- Indeed e Glassdoor exigem outra estrategia, pois retornam security check neste ambiente.
- Descricao de LinkedIn guest search e sintetica quando o card publico nao expoe descricao completa.

## Proximo passo recomendado
Adicionar smoke test automatizado de scraper com mocks de fetch para proteger parser/fetcher sem depender de rede externa.
