# TASK-AT-090 - Scriptoteca: navegacao por categoria e preview

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-090-script-library-navigation-preview.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.2
- dependencias: `TASK-AT-089`

## Objetivo unico
Criar a tela da Scriptoteca com menu lateral/indice por categoria, lista central e painel de leitura confortavel.

## Escopo funcional
1. Aba/entrada de navegacao para Scripts SAC ou Scriptoteca.
2. Menu lateral de categorias.
3. Lista de scripts filtrada pela categoria selecionada.
4. Preview do script com titulo, canal, tags, status e texto.
5. Estados vazios para sem categoria, sem scripts e sem selecao.

## Acceptance Criteria
1. Clicar em categoria mostra scripts correspondentes.
2. Selecionar script abre preview sem tabela apertada.
3. Status validado/obsoleto fica visualmente claro.
4. Layout funciona em desktop e mobile basico.
5. Typecheck/build passam.

## Riscos
- Criar pagina bonita mas lenta para uso diario.
- Esconder scripts importantes em menus profundos.

## Execucao
- execution-log: docs/tasks/EXEC-AT-090-script-library-navigation-preview.md
