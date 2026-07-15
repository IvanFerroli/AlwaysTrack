# TASK-AT-337 - Coverage: inventario executavel e mapa de risco por superficie

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-337-executable-coverage-risk-inventory.md

## Modo
- mode: implementation
- generation-mode: coverage-presentation-uplift

## Objetivo unico
Gerar um inventario reproduzivel que relacione coverage por arquivo, risco de negocio, jornada critica e owner antes de elevar thresholds.

## Dependencias
- satisfeitas: TASK-AT-315 e TASK-AT-336.

## Escopo
- Consolidar os seis `coverage-summary.json` em um artefato JSON/HTML versionado apenas como gerador, sem versionar resultados locais.
- Registrar SHA, Node, Vitest, timestamp, classificacao da evidencia, numerador/denominador, threshold e margem.
- Identificar arquivos em 0%, entrypoints, subprocessos e modulos criticos por jornada.
- Classificar lacunas em P0, P1 e P2 com owner e task de fechamento.

## Acceptance Criteria
1. Um comando raiz gera o inventario a partir dos seis reports.
2. Cada arquivo critico possui owner, risco, percentual e task associada.
3. O inventario falha quando um workspace ou summary esperado esta ausente.
4. Nenhum arquivo e excluido da medicao para melhorar o numero.
5. Nao existe media simples/score composto e qualquer contador `0/0` e representado como `N/A`.

## Validacao
- testes unitarios do agregador, `npm run coverage:check`, `npm run check:docs` e `git diff --check`.

## Resultado
- `npm run coverage:manifest` gera JSON e HTML locais para os seis workspaces, preservando numeradores, denominadores, pisos, margens, SHA, runtime e frescor.
- Os 18 arquivos criticos configurados possuem owner, risco, task e avaliacao individual; summaries ausentes, invalidos ou abaixo do piso encerram o comando com falha.
- Arquivos com 0% permanecem explicitos e contadores vazios sao exibidos como `N/A`, sem media ou score composto.
- O gerador e seus cenarios de ausencia, corrupcao, caminhos criticos e counters vazios integram `npm run test:startup`.

## Riscos
- Transformar inventario em ranking cosmetico sem priorizacao de jornada.

## Handoff
- handoff_to: olympus_orchestrator
- execution_expectation: executar antes dos uplifts para fixar baseline e owners.
- constraints: preservar percentuais brutos e classificacao `local`.
