# TASK-AT-338 - Presentation Hub: painel comparativo de coverage

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
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

## Resultado
- O Hub apresenta as quatro metricas brutas dos seis workspaces, pisos, arquivos zerados, gates e arquivos criticos aprovados, com link para scorecard independente.
- Estados `passed`, `at-risk`, `stale`, `missing` e `invalid` sao derivados do manifesto fresco; Web permanece visivelmente em 6.82%, sem equivalencia visual ou numerica com o Host em 89.84%.
- A allowlist inclui somente o artefato gerado de coverage e conserva as protecoes de traversal e arquivos sensiveis.
- Smoke HTTP aprovou os 29 destinos da apresentacao; Playwright desktop/mobile e axe WCAG A/AA passaram sem violacoes depois de tornar a regiao rolavel focavel e remover refresh temporizado.
- O smoke encontrou e corrigiu o repasse de `--port` ao Vite no `npm run up`, que antes podia iniciar a Web com raiz incorreta e falhar readiness.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: implementar cedo; os uplifts seguintes atualizam o painel automaticamente.
- constraints: preservar percentuais brutos e aviso de evidencia local/fake.
