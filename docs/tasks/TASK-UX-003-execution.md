# TASK-UX-003 - Execution Report

## Metadata
- task-id: TASK-UX-003
- execution-id: EXEC-UX-003
- specialist: olympus-runtime-builder
- execution-mode: execution artifact mode
- date: 2026-04-26
- status: completed-with-remarks

## Escopo executado
1. Ordenacao por data convertida para toggle direto no formulario de filtros.
2. Dropdowns compactos mantidos com chips removiveis e seta recolhivel.
3. Busca interna e botao "Limpar" adicionados em cada dropdown multi-select.
4. Resumo de filtros ativos adicionado abaixo do formulario.
5. Campo de busca textual (`q`) exposto na UI para controle direto via dashboard.

## Artefatos materializados
- `apps/web/src/features/dashboard/render-dashboard.ts`
- `docs/tasks/TASK-UX-003-hierarquia-toggle-e-overhaul-filtros.md`
- `docs/tasks/TASK-UX-003-execution.md`
- `docs/tasks/TASK-UX-003-verification.md`

## Evidencias
- Toggle de ordenacao atualiza `sortByDate` (`newest`/`oldest`) e reaplica filtro.
- Dropdowns exibem selecao ativa via chips com remocao por `x`.
- Busca interna filtra opcoes sem perder estado de selecao.
- Botao "Limpar" do dropdown remove selecoes do filtro atual.

## Ressalvas
- Busca interna opera no conjunto carregado do batch atual (nao consulta remota).
