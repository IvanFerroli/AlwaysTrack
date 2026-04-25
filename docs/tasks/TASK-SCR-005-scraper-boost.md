# TASK-SCR-005 - Boost de Ingestão do Scraper

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-25

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
   - Estado implementado em 2026-04-25: Jobicy opera com `count=50`; aumento para `count=200` nao esta materializado no codigo atual.
2. Garantir que a promessa `Promise.all` não crasheie a memória na hora do ingest, visto que agora faremos mass-insert de centenas de vagas.

## Definition of Done
- URIs modificadas visando maior volume de retorno.
- Run resultando em maior volume quando as fontes responderem, sem promessa fixa de quantidade.
