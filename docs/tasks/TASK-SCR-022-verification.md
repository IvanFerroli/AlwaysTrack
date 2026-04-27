# VER-SCR-022 - Verificacao do conector ATS Lever

## Metadata
- task-id: TASK-SCR-022
- verification-id: VER-SCR-022
- status: approved-with-remarks
- owner: olympus-task-verifier
- last-updated: 2026-04-26

## Resultado da verificacao
- classificacao final: `aprovado com ressalvas`
- objetivo unico: atendido
- escopo: aderente ao manifesto

## Achados
1. Fonte `lever` entrou no registry canônico com `method=ats`.
2. Contrato de fetch/parse para payload público Lever está operacional.
3. Caminho de execução `source=lever` retorna ingestão e report coerentes.
4. Suite de scraper e gate global estão verdes após a mudança.

## Ressalvas
- endpoint default pode não refletir todos os tenants reais de Lever.
- é recomendado acompanhar qualidade de location/description em rodadas reais.

## Evidencias
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Gates
- `npm run check` ✅

## Proxima task recomendada
- `TASK-SCR-023`
