# TASK-AT-348 - Coverage: gate final e ensaio da apresentacao

## Metadata
- status: completed-local-validation
- owner: quality-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-348-coverage-presentation-final-gate.md

## Modo
- mode: audit
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Provar que os novos baselines, reports e scorecard sao reproduziveis, honestos e apresentaveis no commit final.

## Dependencias
- TASK-AT-337 a TASK-AT-347.

## Escopo
- Executar coverage completo duas vezes e comparar totais/frescor.
- Reabrir `npm run up`, validar scorecard, seis HTMLs e links de evidencia.
- Ensaiar desktop/mobile, teclado e narrativa de risco sem alegar readiness produtiva.

## Acceptance Criteria
1. Duas execucoes produzem os mesmos denominadores e passam thresholds.
2. Manifesto e hub referenciam o mesmo SHA; stale/ausente/invalido falham visivelmente.
3. Todos os workspaces exibem quatro metricas, piso, margem e arquivos zerados.
4. Web, SmartScript, Extension, Shared, API e Host cumprem os marcos aprovados ou o gate retorna NO-GO explicito.
5. Evidencia local/fake e riscos residuais permanecem visiveis.

## Validacao
- `npm run coverage:check` duas vezes, `npm run check`, docs, hygiene, Playwright desktop/mobile e auditoria manual.

## Resultado
- Decisao para a apresentacao: `GO-WITH-RISK`; a evidencia e local/fake e nao autoriza rollout produtivo.
- Duas execucoes completas dos seis workspaces passaram thresholds e produziram numeradores e denominadores identicos (`COVERAGE_STABLE=true`).
- Manifesto: Shared, Extension, API e Companion Host `passed`; SmartScript e Web `at-risk` por margem incremental estreita, sem threshold violado.
- Coverage final de linhas: Shared 71.20%, Extension 91.17%, SmartScript 80.59%, Web 36.75%, API 77.64% e Companion Host 97.80%.
- Playwright completo e serializado no banco E2E isolado: 34 cenarios aprovados, 1 skip intencional da fixture fiscal duplicada no projeto mobile e 0 falhas.
- O ensaio real no Chromium atualizou quatro snapshots aprovados, estabilizou a navegacao legada e corrigiu a conversao monetaria da revisao de DANFE antes da demonstracao.
- Integridade documental, rollout audit, startup contract e higiene do repositorio aprovados; Redis real permanece teste opt-in.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: emitir GO/GO-WITH-RISK/NO-GO apenas para a apresentacao de coverage.
- constraints: nao converter cobertura local em autorizacao de rollout/exposicao.
