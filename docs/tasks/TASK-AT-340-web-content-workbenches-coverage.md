# TASK-AT-340 - Web coverage: Scriptoteca, Wiki e Notas em 20%

## Metadata
- status: planned
- owner: web/product
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-340-web-content-workbenches-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Cobrir as tres maiores workbenches Web atualmente em 0% e atingir o segundo marco incremental.

## Dependencias
- TASK-AT-339.

## Escopo
- Scriptoteca: busca, filtros, sugestao/copia, permissoes e falha API.
- Wiki e Notas: listagem, vazio, edicao, cancelamento, upload sintetico e erro.
- Loading, retry, confirmacoes e protecao contra persistencia em falha.

## Acceptance Criteria
1. `script-library.tsx`, `wiki.tsx` e `notes.tsx` deixam 0% e recebem pisos por arquivo.
2. Cada superficie cobre leitura, mutacao autorizada e caminho negativo.
3. Web atinge pelo menos 20% de linhas, 38% de funcoes e preserva branches.
4. Nenhum teste usa dado real, provider externo ou snapshot sem interacao.

## Validacao
- coverage Web, testes das tres views, upload/redaction, acessibilidade e build.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: commits por superficie para facilitar revisao e ratchet de threshold.
- constraints: mock no limite HTTP e fixtures sanitizadas.
