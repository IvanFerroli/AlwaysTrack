# TASK-AT-344 - Shared coverage: action firewall e contratos executaveis

## Metadata
- status: planned
- owner: platform/contracts
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-344-shared-firewall-contract-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Cobrir diretamente o firewall canonico e os contratos que cruzam Core, Extension e Host.

## Dependencias
- TASK-AT-317 e TASK-AT-337.

## Escopo
- `security/action-firewall.ts`: allow/deny, contexto, capability, confirmacao e autorizacao.
- Autorizacao expirada, consumida, desconhecida e valida.
- Eventos Companion, execucao de conectores, evidencias e conflitos.

## Acceptance Criteria
1. Firewall Shared deixa 0% e possui threshold critico proprio.
2. Matriz fail-closed cobre todos os estados de autorizacao.
3. Shared atinge pelo menos 65% de linhas; branches/funcoes nao regridem.
4. Nenhum barrel/type-only e excluido para elevar o total.

## Validacao
- coverage Shared, fuzz/protocol tests, consumidores API/Extension/Host e build.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: consolidar ownership no contrato canonico, mantendo wrappers testados.
- constraints: nenhuma divergencia entre firewalls consumidores.
