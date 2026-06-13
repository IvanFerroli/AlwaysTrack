# EXEC-AT-075 - Playwright/CI limpo

## Metadata
- status: completed-with-local-environment-note
- owner: codex
- last-updated: 2026-06-13
- task: docs/tasks/TASK-AT-075-playwright-ci-environment-cleanup.md

## Escopo executado
- Separado smoke rapido de CI em `npm run test:e2e:smoke`.
- Mantida suite completa em `npm run test:e2e` e adicionado `npm run test:e2e:api`.
- CI passou a executar o smoke desktop explicito e publicar `test-results/e2e-artifacts`/`playwright-report` em falha.
- Criado runbook `docs/testing/playwright-ci.md` com diagnostico de dependencias Chromium, `libnspr4.so` e interpretacao de falhas.

## Evidencia local
- `npm run test:e2e:smoke` inicializou o webServer isolado, mas falhou antes do teste por dependencia nativa ausente:
  - `libnspr4.so: cannot open shared object file: No such file or directory`
- `npx playwright install-deps chromium --dry-run` confirmou dependencias ausentes, incluindo `libnspr4`, `libnss3` e `xvfb`.

## Risco residual
- A validacao browser local depende de permissao para instalar pacotes do sistema. No CI, o workflow usa `npx playwright install --with-deps chromium`.
