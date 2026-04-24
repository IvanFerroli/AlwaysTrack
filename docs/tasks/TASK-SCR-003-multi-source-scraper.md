# TASK-SCR-003 - Melhoria Parruda do Scraper (Multi-source + All Mode)

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-SCR-003-multi-source-scraper.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- job-scraping

## Origem documental
- Pedido explicito do usuario ("mega fluxo de melhoria do scraper, deixa bem parrudo pra trazer um bocado de vagas de diversas fontes")

## Objetivo unico
Adicionar novas fontes (RemoteOK, Jobicy) ao scraper e habilitar um modo "all" que executa o scraping de todas as fontes simultaneamente, consolidando os resultados.

## Contexto minimo
O scraper estava limitado a rodar uma fonte por vez (default: Remotive). Para popular a plataforma de forma rica e robusta, e preciso suportar mais fontes e permitir rodar todas elas de uma unica vez (`SCRAPER_SOURCE=all`).

## Inputs
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`

## Dependencias
- satisfeitas: TASK-SCR-001, TASK-SCR-002
- em aberto: n/a

## Alvos explicitos
1. Modificar tipos em `scraper.types.ts` para suportar novas fontes.
2. Atualizar fetcher para lidar com payload json das novas fontes.
3. Adicionar parseItems em `scraper.parser.ts`.
4. Atualizar `runScraper` em `scraper.runner.ts` para suportar parametro `all`.

## Fora de escopo
- Tratamento assincrono em background worker (API continua rodando request bloqueante para simplicidade do MVP).

## Checklist
1. Adicionar `remoteok-json` e `jobicy-json` ao `ScraperSourceConfig`.
2. Adicionar configuracoes estaticas no runner.
3. Extrair execucao individual para helper interno no runner.
4. Implementar `Promise.all` em `runScraper` quando `sourceKey === "all"`.
5. Implementar mapeamento de dados no fetcher e parser.

## Acceptance Criteria
1. Chamada a API scraper com `source=all` executa todas as fontes sem quebrar.
2. Tokens continuam sendo sanitizados de HTML.
3. typecheck verde.

## Definition of Done
1. Implementacao do "all" mode feita e testada.
2. Novas fontes adicionadas (RemoteOK, Jobicy).

## Validacao
- typecheck
- curl chamando `POST /v1/scraper/run`

## Evidencia esperada
- JSON da resposta retornando `fetched` e `ingested` combinados de multiplas fontes.

## Handoff
- handoff_to: olympus-orchestrator
