# EXEC-AT-142 - Regressao e stress dos pacotes da Scriptoteca

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-142-script-library-packs-regression-performance.md
- owner: olympus_orchestrator
- completed-at: 2026-06-19

## Resumo
Fechada a lacuna de cobertura dos pacotes/roteiros da Scriptoteca com regressao API, smoke browser ampliado e Artillery cobrindo leitura/copia da Scriptoteca. A rodada tambem corrigiu estouros visuais em cards/listas de Scriptoteca/Fluxos e fez os scripts locais abrirem mais artefatos no navegador.

## Mudancas
1. `tests/e2e/api-flows.api.spec.ts` cria categoria, dois scripts, pacote, reordena o pacote, lista por busca e registra copia.
2. `tests/e2e/app-smoke.spec.ts` passa a navegar Avisos, Fluxos e Scriptoteca no smoke principal.
3. `tests/performance/alwaystrack-smoke.yml` inclui Fluxos, Scriptoteca e copia de script com `scriptId` capturado; tambem reduz o ritmo local para evitar rate limit artificial de login.
4. `tests/performance/alwaystrack-1000.yml` inclui Fluxos e Scriptoteca como leitura de baixa frequencia.
5. `scripts/start-all.js` abre app, API, Prisma Studio, bancada, TypeDoc, docs de teste/performance/seguranca, reports Playwright, coverage e ultimo report HTML de performance quando existirem.
6. `scripts/perf-report.js` abre automaticamente o HTML gerado, salvo `--no-open`.
7. `apps/web/src/styles.css` reforca que sidebar, roteiros, cards de scripts e steps de Fluxos quebrem texto sem sobreposicao.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run typecheck --workspace @alwaystrack/api`: passou.
- `git diff --check`: passou.
- `npm run test:e2e:api`: passou, 3 specs.
- `npm run test:e2e:smoke`: falhou por ambiente local conhecido: Chromium nao abre por falta de `libnspr4.so`.
- `SEED_ADMIN_PASSWORD='AlwaysTrackE2E123!' node scripts/perf-report.js smoke --target=http://localhost:3334 --quiet --no-open`: passou.

## Evidencias
- Report limpo: `docs/performance/reports/smoke-2026-06-19T01-21-23-713Z.html`.
- JSON do report mostra apenas `http.codes.200` e endpoints novos:
  - `/v1/service-flows`
  - `/v1/script-library`
  - `/v1/script-library/scripts/{{ scriptId }}/copy`

## Ressalvas
- O smoke browser precisa de `npx playwright install --with-deps chromium` ou libs equivalentes no SO para rodar localmente.
- O smoke Artillery local nao prova 1000 usuarios; continua sendo diagnostico de regressao.
