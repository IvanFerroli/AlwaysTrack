# TASK-AT-091 - Scriptoteca: busca, tags e filtros

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-091-script-library-search-tags-filters.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.3
- dependencias: `TASK-AT-089`, `TASK-AT-090`

## Objetivo unico
Permitir encontrar scripts por titulo, categoria, tags, canal e palavras dentro do texto.

## Escopo funcional
1. Campo de busca rapida.
2. Filtros por categoria, canal, tag e status.
3. Busca combinada com filtros funcionando juntos.
4. Ordenacao padrao por validado/recente/titulo.
5. Limite de resultados e paginação se necessario.

## Acceptance Criteria
1. Busca por "acareacao", "endereco", "estorno" ou termo do texto retorna scripts relevantes.
2. Tags e canal filtram junto com texto.
3. Scripts obsoletos nao aparecem como padrao principal.
4. Busca vazia tem estado claro.
5. API respeita escopo e permissoes.

## Riscos
- Fazer busca semantica antes do MVP.
- Filtros client-side ficarem ruins com volume grande.
