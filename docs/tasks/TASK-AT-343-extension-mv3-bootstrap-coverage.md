# TASK-AT-343 - Extension coverage: bootstrap e fronteiras MV3

## Metadata
- status: completed-local-validation
- owner: companion/extension
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-343-extension-mv3-bootstrap-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Cobrir a inicializacao operacional da Extension, hoje ausente apesar dos modelos internos testados.

## Dependencias
- TASK-AT-317, TASK-AT-318 e TASK-AT-337.

## Escopo
- `service-worker.ts`, `side-panel.ts`, listeners, subscriptions, reconnect e teardown.
- Adapters Chrome/DOM falsos somente nas fronteiras MV3.
- Wiring de TabRegistry, content script, protocolo e UI.

## Acceptance Criteria
1. Service worker e side panel deixam 0% com bootstrap e teardown exercitados.
2. Pelo menos quatro modulos antes zerados possuem testes comportamentais.
3. Extension atinge 65% de linhas, 76% de branches e 81% de funcoes.
4. Action firewall permanece em 100% e os pisos sobem no mesmo commit.

## Validacao
- coverage Extension, E2E unpacked MV3, reconnect, manifest e build.

## Resultado
- Service worker ganhou lifecycle explicito de bootstrap/teardown e cobertura de listeners, instalacao, pairing, propagacao de estado e falha controlada.
- Side panel e content script exercitam wiring DOM/Chrome, atalhos, mensagens, intervencoes, reconnect e captura read-only nas fronteiras MV3 falsas.
- A Extension passou 113 testes em 35 arquivos e atingiu 91.17% de linhas/statements, 79.29% de branches e 89.70% de funcoes, preservando o action firewall em 100%.
- Service worker ficou em 100%; side panel ficou em 100% de linhas/funcoes e 93.87% de branches. O E2E Chromium unpacked com Host falso, manifesto e build MV3 foram aprovados.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: testar wiring real, sem repetir apenas modelos internos.
- constraints: Chromium/Host controlados; live Windows permanece na TASK-AT-334.
