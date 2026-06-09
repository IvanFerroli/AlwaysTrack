# EXEC-AT-037 - Quality gates, e2e, migrations and performance

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-09
- tasks: TASK-AT-049, TASK-AT-050, TASK-AT-051, TASK-AT-055

## Entrega
- Playwright configurado com ambiente isolado em portas `3334/5174` e banco `.tmp/e2e`.
- Smoke e2e cobre login admin e navegacao das principais areas comerciais.
- Migration gate valida schema vazio, schema seedado e backup/restore local em SQLite temporario.
- Artillery configurado com smoke local e cenario de 1000 usuarios para ambiente alvo.
- CI ganhou gates separados: qualidade, docs, migrations, higiene e e2e desktop.
- Onboarding criado em `CONTRIBUTING.md` e template de PR criado.

## Validacao
- `npm run repo:hygiene` passou.
- `npm run db:test:migrations` passou.
- `npm run check:docs` passou.
- `SEED_ADMIN_PASSWORD=AlwaysTrackE2E123! npm run perf:smoke -- --target=http://localhost:3334` passou com 160 respostas 200.
- `npm run test:e2e -- --project=desktop` subiu o app isolado, mas o browser local nao abriu por falta de `libnspr4.so`.

## Riscos residuais
- Playwright depende de pacotes de SO; CI instala com `npx playwright install --with-deps chromium`.
- `perf:1000` precisa de ambiente stage/producao-like; nao deve ser interpretado por resultado em SQLite local.
- Fluxos e2e profundos ainda precisam ser expandidos alem do smoke.
- `npm audit` completo mostra moderadas em `exceljs` e dev deps do Artillery; correcao sugerida usa `--force`.
