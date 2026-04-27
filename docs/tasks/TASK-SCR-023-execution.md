# EXEC-SCR-023 - Conector ATS Workday (job feed publico)

## Metadata
- task-id: TASK-SCR-023
- execution-id: EXEC-SCR-023
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Fonte `workday` adicionada ao registro canonico do scraper (`method=ats`).
2. Fetcher adaptado para payload Workday em formatos suportados (`array`, `jobPostings[]`, `postings[]`).
3. Parser dedicado para normalizacao de campos Workday (`title/jobTitle`, `externalPath/url`, localizacao e data de postagem).
4. Runner ajustado para keyword query em Workday e fluxo padrao de ingestao/dedupe.
5. Cobertura de testes para caminho de sucesso e falha esperada por shape nao suportado.

## Arquivos alterados
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Evidencias materiais
- `source=workday` funcional no runner com `sourceReports[0].method = ats`.
- parser converte payload Workday para contrato canonico de vaga nos formatos suportados.
- testes novos para parse e run da fonte passam, inclusive cenario de degradacao tipada.

## Riscos e ressalvas
- variacao de endpoint/schema por tenant Workday pode exigir ajustes incrementais.
- campo de descricao/localizacao pode variar de qualidade conforme payload publico disponivel.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
