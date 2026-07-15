# TASK-AT-347 - Companion Host coverage: bootstrap e branches residuais

## Metadata
- status: planned
- owner: companion/host
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-347-companion-host-residual-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Consolidar o workspace mais coberto sem deixar bootstrap, protocolo e encerramento como divida permanente.

## Dependencias
- TASK-AT-317, TASK-AT-337 e TASK-AT-343.

## Escopo
- `main.ts`, barrels runtime/server e branches residuais do protocolo/companion server.
- Bootstrap sem recursos reais, rejeicao de protocolo e encerramento gracioso.
- Preservar security/firewall em 100%.

## Acceptance Criteria
1. Host atinge pelo menos 92% de linhas, 84% de branches e 95% de funcoes.
2. Bootstrap e shutdown nao abrem sockets ou storage reais nos testes.
3. Rejeicoes e cleanup possuem assertions comportamentais.
4. Thresholds sobem sem relaxar metas criticas.

## Validacao
- coverage Host repetido, protocolo, lifecycle, security e build.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: executar depois das fronteiras MV3 para preservar contratos alinhados.
- constraints: evidencia local nao substitui Windows/WSL live.
