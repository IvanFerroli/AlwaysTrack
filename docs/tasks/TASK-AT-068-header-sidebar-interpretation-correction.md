# TASK-AT-068 - Header/sidebar interpretation correction

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-068-header-sidebar-interpretation-correction.md

## Modo
- mode: visual-polish

## Objetivo unico
Corrigir a interpretacao da rodada anterior: `Perfil` deve continuar no menu lateral como segunda opcao, e os atalhos do header devem ficar em uma unica faixa horizontal abaixo das informacoes principais do header.

## Contexto minimo
Na `TASK-AT-067`, Perfil foi removido do menu lateral e a navegacao superior foi permitida quebrar em duas linhas. O usuario esclareceu que queria Perfil no menu lateral em segunda posicao e uma unica fila de botoes no header, posicionada abaixo do bloco superior e ocupando a largura toda.

## Escopo
1. Reordenar menu lateral para `Dashboard`, `Perfil`, demais itens.
2. Remover `Perfil` da faixa de atalhos do header para evitar duplicidade.
3. Reestruturar header em duas areas: linha superior com titulo/usuario e linha inferior com atalhos full-width.
4. Manter sidebar colapsavel e correcoes de overflow de Wiki/FAQ da task anterior.

## Acceptance Criteria
1. `Perfil` aparece no menu lateral como segunda opcao.
2. `Perfil` nao aparece duplicado na faixa de atalhos do header.
3. Atalhos do header ficam em uma unica linha no desktop, abaixo do bloco de titulo/usuario.
4. Header nao usa scrollbar horizontal para os atalhos.
5. Build web passa.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

