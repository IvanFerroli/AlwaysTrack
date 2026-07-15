# TASK-AT-338 - Presentation Hub: painel comparativo de coverage

## Metadata
- status: planned
- owner: quality-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-338-presentation-hub-coverage-panel.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Apresentar coverage dos seis workspaces com contexto de risco, piso e frescor, sem reduzir qualidade a percentual de linhas.

## Dependencias
- TASK-AT-336 e TASK-AT-337.

## Escopo
- Consumir o manifesto consolidado e manter links para os seis HTMLs.
- Exibir linhas, statements, branches e funcoes com coberto/total, percentual, piso e margem.
- Mostrar arquivos zerados, commit, timestamp e evidencia `local`.
- Estados: aprovado, `at-risk` com margem menor que 2 pp, desatualizado, ausente e invalido.

## Acceptance Criteria
1. `0/0` aparece como `N/A`; nenhuma media ou score composto mascara lacunas.
2. Verde exige artifact fresco e todos os thresholds aprovados.
3. Web 6.82% nao possui a mesma leitura visual do Host 89.84%.
4. Allowlist, traversal/symlink, teclado, contraste e mobile permanecem cobertos.

## Validacao
- testes do workbench, Playwright desktop/mobile, axe, links HTTP e `npm run check`.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: implementar cedo; os uplifts seguintes atualizam o painel automaticamente.
- constraints: preservar percentuais brutos e aviso de evidencia local/fake.
