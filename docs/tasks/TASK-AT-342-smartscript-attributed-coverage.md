# TASK-AT-342 - SmartScript coverage: CLI e storage atribuiveis

## Metadata
- status: planned
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

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: cobrir storage primeiro e depois tornar o command runner testavel.
- constraints: nenhum storage pessoal, clipboard ou Espanso real.
