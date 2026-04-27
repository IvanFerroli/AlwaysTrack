# VER-SCR-021 - Verificacao de conector ATS Greenhouse

## Metadata
- task-id: TASK-SCR-021
- verification-id: VER-SCR-021
- status: approved-with-remarks
- owner: olympus-task-verifier
- last-updated: 2026-04-26

## Resultado da verificacao
- classificacao final: `aprovado com ressalvas`
- objetivo unico: atendido
- escopo: aderente ao manifesto

## Achados
1. Fonte `greenhouse` foi adicionada ao registro canônico com `method=ats`.
2. Parse Greenhouse converte payload para ingestão sem quebrar contrato existente.
3. Teste dedicado de execução (`source=greenhouse`) cobre caminho principal.

## Ressalvas
- endpoint default pode não refletir todos tenants reais.
- monitorar variações de schema para evitar regressão silenciosa.

## Evidencias
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Gates
- `npm run check` ✅

## Proxima task recomendada
- `TASK-SCR-022`
