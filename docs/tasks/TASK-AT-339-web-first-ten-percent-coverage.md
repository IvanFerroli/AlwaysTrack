# TASK-AT-339 - Web coverage: primeiro marco real de 10%

## Metadata
- status: planned
- owner: web/product
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-339-web-first-ten-percent-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Levar a Web de 6.82% para um primeiro piso sustentavel cobrindo bootstrap, sessao, roles e navegacao.

## Dependencias
- TASK-AT-311, TASK-AT-312 e TASK-AT-337.

## Escopo
- `main.tsx`: loading, autenticado, nao autenticado, expiracao e API indisponivel.
- Matriz ADMIN, SAC, FINANCEIRO, VENDEDOR, SUPERVISOR e RT.
- Rotas permitidas/bloqueadas, fallback, retry e logout.

## Acceptance Criteria
1. Linhas/statements Web chegam a pelo menos 10%, funcoes a 32% e branches nao caem de 57.40%.
2. Denominador de fontes nao diminui e snapshots cosmeticos nao contam como cobertura suficiente.
3. Thresholds sobem no mesmo commit dos testes.
4. Tela vazia e destino proibido possuem regressao explicita.

## Validacao
- coverage Web duas vezes, testes de componente/role, acessibilidade e build Web.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: priorizar comportamento e estados negativos sobre refatoracao ampla.
- constraints: nao remover fontes do include nem mockar os guards de role.
