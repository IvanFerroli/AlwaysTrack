# TASK-AT-348 - Coverage: gate final e ensaio da apresentacao

## Metadata
- status: planned
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

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: emitir GO/GO-WITH-RISK/NO-GO apenas para a apresentacao de coverage.
- constraints: nao converter cobertura local em autorizacao de rollout/exposicao.
