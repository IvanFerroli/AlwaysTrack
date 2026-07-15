# TASK-AT-342 - SmartScript coverage: CLI e storage atribuiveis

## Metadata
- status: completed-local-validation
- owner: companion/smartscript
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-342-smartscript-attributed-coverage.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Fazer CLI e filesystem contribuirem corretamente ao V8 sem contabilizar artificialmente o E2E de subprocesso.

## Dependencias
- TASK-AT-319 e TASK-AT-337.

## Escopo
- `storage.ts`: JSON invalido, escrita, append, leitura diaria, idempotencia e purge temporario.
- Separar parsing/dispatch de `process.exit` para teste in-process ou mesclar coverage suportado dos subprocessos.
- Login/import/export, retention, allowlist, Espanso e falhas de filesystem.

## Acceptance Criteria
1. `cli.ts` e `storage.ts` deixam 0%; storage atinge pelo menos 85% de linhas.
2. SmartScript chega a pelo menos 30% de linhas, 70% de branches e 85% de funcoes.
3. E2E de subprocesso continua separado e nao duplica contadores.
4. Duas execucoes produzem o mesmo baseline em diretorio temporario.

## Validacao
- coverage SmartScript repetido, CLI E2E, filesystem temporario e build.

## Resultado
- `storage.ts` possui seis testes diretos e atingiu 100% de linhas/funcoes e 94.11% de branches em diretorios temporarios.
- O runner `runCli` e testavel in-process sem alterar a execucao ESM real; tres testes diretos complementam os tres E2E de subprocesso sem duplicar counters V8.
- SmartScript passou 16 testes e elevou o baseline global para 80.59% de linhas, 72.44% de branches e 91.48% de funcoes.
- Pisos globais subiram para 80/70/90 e os thresholds criticos de CLI, storage, processor e Espanso foram aprovados em execucao repetida.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: cobrir storage primeiro e depois tornar o command runner testavel.
- constraints: nenhum storage pessoal, clipboard ou Espanso real.
