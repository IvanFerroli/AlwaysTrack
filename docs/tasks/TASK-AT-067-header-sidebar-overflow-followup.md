# TASK-AT-067 - Header/sidebar overflow follow-up

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-067-header-sidebar-overflow-followup.md

## Modo
- mode: visual-polish

## Objetivo unico
Corrigir os problemas remanescentes apontados pelo usuario apos a AT-066: Perfil ainda no menu lateral, header com scrollbar, botoes/listas ainda estourando e menu lateral sem colapso.

## Contexto minimo
O primeiro polish colocou Perfil no topo, mas nao removeu o item do sidebar. A navegacao superior evitou quebra usando scroll horizontal, solucao rejeitada pelo usuario. Cards da Wiki/FAQ ainda herdavam altura fixa global de botoes, causando sobreposicao quando titulos e metadados quebravam linha.

## Escopo
1. Remover `Perfil` da navegacao lateral, mantendo no topo e no botao de usuario.
2. Eliminar scrollbar horizontal dos atalhos superiores e permitir quebra em linha adicional dentro do header.
3. Criar menu lateral colapsavel.
4. Corrigir cards/botoes de Wiki/FAQ para crescerem com conteudo.
5. Manter paginação visualmente separada dos cards.

## Fora de escopo
- Redesign completo do header.
- Mudar permissoes, rotas ou regras de negocio.
- Trocar identidade visual.

## Acceptance Criteria
1. `Perfil` nao aparece mais no menu lateral.
2. Atalhos superiores nao exibem scrollbar.
3. Atalhos superiores podem quebrar para uma segunda linha no header.
4. Sidebar possui controle para recolher/expandir.
5. Cards de Wiki/FAQ nao sobrepoem titulo, metadados e paginacao.
6. Build web passa.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

