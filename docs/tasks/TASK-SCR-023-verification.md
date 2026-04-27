# VER-SCR-023 - Verificacao do conector ATS Workday

## Metadata
- task-id: TASK-SCR-023
- verification-id: VER-SCR-023
- status: approved-with-remarks
- owner: olympus-task-verifier
- last-updated: 2026-04-26

## Resultado da verificacao
- classificacao final: `aprovado com ressalvas`
- objetivo unico: atendido
- escopo: aderente ao manifesto

## Achados
1. Fonte `workday` entrou no registry canônico com `method=ats`.
2. Contrato de fetch/parse para payload publico Workday esta operacional para os formatos baseline previstos.
3. Caminho de execução `source=workday` retorna ingestao e report coerentes.
4. Suite de scraper e gate global ficaram verdes apos a mudanca.

## Ressalvas
- endpoint default pode nao refletir todos os tenants reais de Workday.
- variacoes adicionais de schema podem exigir extensao incremental de parser/fetcher.

## Evidencias
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Gates
- `npm run check` ✅

## Proxima task recomendada
- `TASK-SCR-024`
