# TASK-SCR-011 - Reativar CryptoJobsList via RSS com parser dedicado

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-011-reativar-cryptojobslist-via-rss.md

## Modo
- mode: runtime

## Objetivo unico
Reativar cobertura da fonte CryptoJobsList por caminho operacional honesto (RSS/parser dedicado), removendo dependencia do endpoint JSON bloqueado.

## Contexto minimo
Hoje CryptoJobsList esta em `blocked` por falha no endpoint JSON. A memoria explicita essa dependencia aberta.

## Inputs
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `docs/README.md`

## Dependencias
- satisfeitas: TASK-SCR-009, TASK-SCR-010
- em aberto: estabilidade do feed RSS da plataforma

## Alvos explicitos
1. Adicionar formato de fonte RSS para CryptoJobsList no scraper.
2. Implementar parser XML->JobPosting com sanitizacao de campos obrigatorios.
3. Atualizar matriz de modo da fonte para `auto` (ou `fallback` se evidencias exigirem).
4. Cobrir teste com fixture RSS e cenario de falha parcial controlada.

## Fora de escopo
- bypass anti-bot/captcha;
- scraping autenticado;
- crawling profundo fora do feed publico.

## Checklist
1. Definir URL RSS canonica e validar content-type aceito.
2. Criar parse resiliente para itens com campos ausentes.
3. Garantir dedupe coerente com fontes existentes.
4. Atualizar documentacao de capacidade por fonte.

## Acceptance Criteria
1. `source=cryptojobslist` executa sem erro de indisponibilidade artificial.
2. `sourceReports` registra modo efetivo e volume coletado/ingestado.
3. `source=all` inclui a fonte de forma controlada sem quebrar rodada completa.

## Definition of Done
1. Fonte reativada com evidencias reais de ingestao.
2. Testes e docs atualizados para novo estado operacional.

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- revisao manual:
  - rodar `/v1/scraper/run?source=cryptojobslist` e validar report.

## Evidencia esperada
- fixture RSS no teste;
- payload real de rodada com `mode` e contadores da fonte;
- update da matriz em `docs/README.md`.

## Riscos
- feed RSS mudar schema sem aviso;
- baixa qualidade de metadados em alguns itens.

## Blockers possiveis
- feed indisponivel/intermitente no ambiente;
- campos essenciais ausentes para ingestao confiavel.

## Feedback obrigatorio de retorno
- CryptoJobsList ficou em `auto` ou `fallback` final?
- qual volume real de vagas elegiveis foi observado por rodada?
