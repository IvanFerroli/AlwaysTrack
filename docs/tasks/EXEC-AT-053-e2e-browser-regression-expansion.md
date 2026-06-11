# EXEC-AT-053 - Browser E2E regression expansion

## Metadata
- status: completed-partial
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-049

## Objetivo
Adicionar regressao Playwright de navegador para fluxos comerciais que antes estavam cobertos so em service/API.

## Entregas
- Helpers E2E compartilhados em `tests/e2e/helpers.ts`.
- Fixture NF-e deterministica em `tests/e2e/fixtures/nfe-e2e.xml`.
- Spec browser `tests/e2e/commercial-browser.spec.ts` cobrindo:
  - upload DANFE XML via UI;
  - aprovacao de nota via UI;
  - reflexo em Ranking e Extratos;
  - sugestao de edicao Wiki por vendedor;
  - aprovacao Wiki por admin com comentario.

## Validacao
- `npm run test:e2e -- --project=api` passou.
- `npm run test:e2e -- --project=desktop` ficou bloqueado localmente por `libnspr4.so`; CI instala Chromium/deps.
- `npm run test:all` passou.

## Residual
Acompanhar execucao em CI e ampliar browser para FAQ/notificacoes/usuarios se necessario.
