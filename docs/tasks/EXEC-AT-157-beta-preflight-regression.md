# EXEC-AT-157 - Regressao e preflight do Beta Fechado

## Metadata
- status: completed-host-gate-pending
- owner: olympus_orchestrator
- last-updated: 2026-06-21
- source-of-truth: docs/tasks/EXEC-AT-157-beta-preflight-regression.md

## Entregas
1. Smoke beta passou a ativar `APP_MODE=beta-local` e allowlist nominal.
2. Smoke valida outsider bloqueado, admin permitido, SAC sem comercial e vendedor sem terceiros.
3. Banco do smoke foi isolado em `.tmp/smoke-beta/dev.db`.
4. Suite Playwright API cobre SAC, VENDEDOR, SUPERVISOR e FINANCEIRO.
5. `env:check:beta` exige modo beta e allowlist.
6. `beta:preflight` agrega env, unitarios, typechecks, Playwright e smoke.
7. Checklist de homologacao ganhou formulario de feedback.

## Validacoes concluidas
- `APP_MODE=beta-local BETA_ALLOWED_EMAILS=admin@example.com npm run env:check:beta`
- `node --check scripts/smoke-beta-local.js`
- `node --check scripts/check-env.js`
- `npx playwright test tests/e2e/beta-permissions.api.spec.ts --project=api --list`
- 64 testes focados da API passaram.
- Typecheck de web, API e shared passou.

## Validacao pendente
- Execucao integral de `npm run beta:preflight` na maquina host, registrada em `TASK-AT-166`.
