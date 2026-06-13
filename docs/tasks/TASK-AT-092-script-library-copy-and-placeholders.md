# TASK-AT-092 - Scriptoteca: copiar texto e placeholders

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-092-script-library-copy-and-placeholders.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.4
- dependencias: `TASK-AT-090`

## Objetivo unico
Adicionar copia em um clique e suporte inicial a placeholders simples nos textos.

## Escopo funcional
1. Botao visivel de copiar no preview e/ou card.
2. Feedback de sucesso ao copiar.
3. Deteccao/exibicao de placeholders como `{nome_cliente}` e `{numero_pedido}`.
4. Painel opcional de preenchimento simples se couber no MVP.
5. Registro de evento de copia para metrica futura.

## Acceptance Criteria
1. SAC copia script sem selecionar texto manualmente.
2. Placeholder aparece destacado ou listado.
3. Copia nao altera texto original.
4. Falha de clipboard tem fallback visual.
5. Evento de copia pode alimentar metricas.

## Riscos
- Automacao de variaveis crescer demais.
- Clipboard falhar em contexto nao seguro sem fallback.

## Execucao
- execution-log: docs/tasks/EXEC-AT-092-script-library-copy-and-placeholders.md
