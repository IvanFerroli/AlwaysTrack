# EXEC-AT-152 - Google Sheets/Drive com externalFetch

## Metadata
- status: completed
- task: docs/tasks/TASK-AT-152-google-sheets-drive-external-fetch-hardening.md
- completed: 2026-06-19

## Entrega
- Migradas as chamadas Google Sheets/Drive do template nativo para `externalFetch`.
- Mantido o contrato de `fetcher` injetavel usado pelos testes.
- Cada request agora possui operation name e timeout padrao de 15s.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run test --workspace @alwaystrack/api -- google-sheets-template.service.test.ts external-http.test.ts`

## Risco residual
- Scripts manuais de smoke ainda usam `fetch` direto por serem ferramentas CLI isoladas; nao fazem parte do runtime da API.
