# EXEC-SCR-022 - Conector ATS Lever (public postings)

## Metadata
- task-id: TASK-SCR-022
- execution-id: EXEC-SCR-022
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Fonte `lever` adicionada ao registro canonico do scraper (`method=ats`).
2. Fetcher adaptado para contrato Lever (array de postings).
3. Parser dedicado para normalizacao de campos Lever (`text/title`, `hostedUrl`, `categories.location`, `createdAt`).
4. Runner ajustado para keyword query em Lever e fluxo padrao de ingestao/dedupe.
5. Cobertura de testes para parse e execucao da fonte.

## Arquivos alterados
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Evidencias materiais
- `source=lever` funcional no runner com `sourceReports[0].method = ats`.
- parser converte payload Lever para contrato canonico de vaga.
- testes novos para parse e run da fonte passam sem flakiness.

## Riscos e ressalvas
- variação de schema por tenant Lever pode exigir ajustes incrementais.
- quality de metadados de localização depende do preenchimento em `categories`.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
