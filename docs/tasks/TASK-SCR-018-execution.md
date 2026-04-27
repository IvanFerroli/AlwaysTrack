# EXEC-SCR-018 - Registro canonico de fontes e metodos de coleta

## Metadata
- task-id: TASK-SCR-018
- execution-id: EXEC-SCR-018
- status: executada
- owner: olympus-orchestrator
- mode: execution artifact mode
- last-updated: 2026-04-26

## Escopo executado
1. Registro canonico `fonte + method` consolidado no scraper.
2. `sourceReports` passou a expor `method` em todos os caminhos (`auto`, `fallback`, `blocked`, erro).
3. Contrato compartilhado de pipeline atualizado para incluir `method` em `PipelineSourceReport`.
4. Compatibilidade do pipeline preservada para montagem de reports.

## Arquivos alterados
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `services/api/src/features/pipeline/pipeline.service.ts`
- `packages/shared-types/src/index.ts`
- `docs/specs/SPEC-003-job-scraping.md`

## Evidencias materiais
- enum/metadado `method` definido por fonte e propagado no runtime.
- testes com asserts explicitos de `method` por fonte no `sourceReports`.
- typecheck de contratos API/web ajustado sem quebra.

## Riscos e ressalvas
- consumidores antigos nao quebram, mas podem ignorar o novo campo `method` ate adotarem.
- mapeamento de `method` deve permanecer coerente quando novas fontes entrarem.

## Validacao executada
- `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- `npm run check`

## Resultado
- entregue e validado como `completed-with-remarks`.
