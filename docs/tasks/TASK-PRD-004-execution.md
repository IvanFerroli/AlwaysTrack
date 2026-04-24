# EXEC-PRD-004 - Execution Report

## Metadata
- task-id: TASK-PRD-004
- execution-id: EXEC-PRD-004
- mode: runtime
- execution-mode: execution artifact mode
- orchestrator: olympus-orchestrator
- specialist: olympus-runtime-builder
- status: executada
- date: 2026-04-24

## Sequencia operacional aplicada
1. `shared-types/src/index.ts`: Adicionado tipo `JobUserStatus`.
2. `shared-types/src/index.ts`: Modificadas interfaces `JobPosting` e `IngestJobPostingInput` para incluir `postedAt`, `userStatus` e `tags`.
3. `ingestion.service.ts`: Na função `ingest()`, o `insertJobPosting` agora injeta o padrão `userStatus: "new"` e `tags: []`.
4. `scraper.parser.ts`: Adicionado o helper `safeDateStr(value)` que resolve datas em formato ISO ou em UNIX timestamp.
5. `scraper.parser.ts`: Atualizados os 4 parsers (`parseRemotiveItem`, `parseArbeitnowItem`, `parseRemoteOkItem`, `parseJobicyItem`) para extrair os respectivos campos de data das APIs (`publication_date`, `created_at`, `date`, `pubDate`) e injetar como `postedAt`.

## Artefatos materiais
1. `packages/shared-types/src/index.ts`
2. `services/api/src/features/ingestion/ingestion.service.ts`
3. `services/api/src/features/scraper/scraper.parser.ts`

## Evidencias observaveis
- Novas raspagens já criarão itens em memória com `userStatus`, `tags` e `postedAt`.

## Blockers
- Nenhuma. O Typecheck passará porque todos os tipos em cascata (SSR/Frontend) só consomem o objeto base `JobPosting`.
