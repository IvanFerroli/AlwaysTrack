# TASK-SCR-005 - Boost de Ingestão do Scraper

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-24

## Modo
- mode: planning

## Objetivo unico
Modificar as URIs de busca das fontes configuradas para maximizar o número de vagas extraídas em um único run (sem timeout da API).

## Contexto minimo
Remotive estava configurado com `?limit=50`. Arbeitnow e RemoteOK já tendem a trazer centenas. A ideia é ajustar as strings de conexão e garantir que as respostas volumosas sejam corretamente parseadas, engolindo os arrays maiores.

## Alvos explicitos
1. Modificar `SCRAPER_SOURCES` no `scraper.runner.ts` para aumentar/remover limits.
   - Remotive: `limit=250`
   - Jobicy: Checar limite ou pegar feed amplo.
2. Garantir que a promessa `Promise.all` não crasheie a memória na hora do ingest, visto que agora faremos mass-insert de centenas de vagas.

## Definition of Done
- URIs modificadas visando maior volume de retorno.
- Run resultando em 500+ vagas em vez de 300.
