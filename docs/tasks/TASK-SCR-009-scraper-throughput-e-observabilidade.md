# TASK-SCR-009 - Scraper throughput e observabilidade por fonte

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-009-scraper-throughput-e-observabilidade.md

## Modo
- mode: runtime

## Objetivo unico
Aumentar desempenho e previsibilidade do scraper multi-fonte com controle de concorrencia, timeout por fonte e telemetria objetiva por rodada.

## Contexto minimo
O ciclo atual raspa e ingere vagas, mas falta clareza operacional de gargalo por fonte (tempo, volume, dedupe) e tuning de throughput. Sem isso, fica difícil escalar amplitude com confiança.

## Inputs
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `apps/web/src/features/dashboard/render-dashboard.ts` (feedback curto de rodada)

## Dependencias
- satisfeitas: TASK-SCR-007, TASK-SCR-008, TASK-UX-003
- em aberto: n/a

## Alvos explicitos
1. Adicionar limite de concorrencia configuravel por rodada (`SCRAPER_MAX_CONCURRENCY`, fallback seguro).
2. Adicionar timeout por fonte com classificação de falha (`timeout`, `http`, `parse`, `security-check`).
3. Expor no report de `/v1/scraper/run` métricas por fonte: `latencyMs`, `fetched`, `parsed`, `ingested`, `deduplicated`, `discarded`.
4. Garantir que falha de uma fonte não interrompa a rodada completa.

## Fora de escopo
- burlar bloqueios de anti-bot;
- adicionar nova fonte nesta task;
- alterar lógica de afinidade.

## Checklist
1. Implementar execução concorrente com limite explícito.
2. Consolidar `sourceReports[]` no output da rodada.
3. Cobrir timeout/falha parcial em testes.
4. Exibir resumo operacional curto no dashboard após `Run Scraper`.

## Acceptance Criteria
1. `POST /v1/scraper/run` retorna relatório por fonte mesmo com falha parcial.
2. Rodada com N fontes não falha por erro isolado de uma fonte.
3. Testes cobrem concorrência + timeout + falha parcial.

## Definition of Done
1. Throughput configurável e observável por fonte.
2. Evidência de testes verdes e exemplo real de payload de relatório.

## Validacao
- comandos/checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
- revisao manual:
  - rodar scraper com `source=all` e conferir `sourceReports` no retorno.

## Evidencia esperada
- patch em `scraper.runner.ts` + testes;
- payload real de `/v1/scraper/run` com `sourceReports` preenchido.

## Riscos
- concorrência alta causar rate-limit;
- timeout agressivo reduzir cobertura de vagas.

## Blockers possiveis
- fontes com resposta inconsistente;
- ambiente com conectividade instável.

## Feedback obrigatorio de retorno
- qual valor de concorrência ficou como default e por quê?
- qual fonte mais lenta e qual taxa de dedupe observada na evidência?
