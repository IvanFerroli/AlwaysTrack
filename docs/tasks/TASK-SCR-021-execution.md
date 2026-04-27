# EXEC-SCR-021 - Conector ATS Greenhouse (public boards)

## Metadata
- task-id: TASK-SCR-021
- execution-id: EXEC-SCR-021
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Fonte `greenhouse` adicionada ao registro canonico do scraper.
2. Fetcher suporta payload Greenhouse (`jobs[]`) em formato JSON.
3. Parser mapeia posting Greenhouse para contrato canonico de ingestao.
4. Runner suporta keyword query para Greenhouse e report com `method=ats`.
5. Testes adicionados para parse e execucao da fonte.

## Arquivos alterados
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `docs/README.md`

## Evidencias materiais
- `source=greenhouse` funcional com report de metodo ATS.
- parser dedicado com normalizacao minima de campos.
- cobertura de teste para caminho de sucesso.

## Riscos e ressalvas
- variacao de endpoint por tenant Greenhouse pode exigir ajuste de URL.
- qualidade de metadados de localizacao/descricao varia por board.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
