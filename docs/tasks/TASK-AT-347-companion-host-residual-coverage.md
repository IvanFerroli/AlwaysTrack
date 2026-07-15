# TASK-AT-347 - Companion Host coverage: bootstrap e branches residuais

## Metadata
- status: completed-local-validation
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

## Resultado
- Bootstrap e shutdown passaram a ser exercitados com servidor e configuracao controlados, sem sockets ou storage reais; SIGINT/SIGTERM, idempotencia e falha de cleanup possuem assertions diretas.
- Protocolo, cache, deduplicacao, configuracao, recovery e barrels publicos receberam cobertura comportamental de sucesso e rejeicao.
- O Host passou 70 testes em duas execucoes e atingiu 97.80% de linhas/statements, 89.60% de branches e 98.30% de funcoes.
- Firewalls permanecem em 100%; os pisos globais subiram para 92% de linhas/statements, 84% de branches e 95% de funcoes.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: executar depois das fronteiras MV3 para preservar contratos alinhados.
- constraints: evidencia local nao substitui Windows/WSL live.
