# TASK-UX-003 - Hierarquia toggle e overhaul de filtros no dashboard

## Metadata
- id: TASK-UX-003
- capability: dashboard-ux
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-26
- source-of-truth: code + feedback de uso real

## Objetivo unico
Remover friccao no uso dos filtros da dashboard com ordenacao hierarquica alternavel por toggle e UX de filtro mais previsivel (chips, busca interna, limpar rapido, resumo de filtros ativos).

## Contexto minimo
O uso real reportou incomodo com comportamento dos filtros apos ajustes recentes: interacao menos fluida, hierarquizacao sem ergonomia de toggle rapido e baixa clareza do estado ativo dos filtros.

## Alvos explicitos
1. Tornar a ordenacao por data alternavel via toggle unico (mais novo/mais antigo).
2. Manter filtros compactos com chips removiveis e dropdown recolhivel.
3. Adicionar busca interna e acao de limpar dentro de cada dropdown multi-select.
4. Exibir resumo de filtros ativos para leitura rapida do estado aplicado.
5. Preservar combinacao de filtros com paginação backend sem regressao funcional.

## Fora de escopo
- alterar regra de ranking/scoring de afinidade;
- alterar contratos da API alem do necessario para UX;
- redesign estrutural de outras paginas fora da dashboard.

## Definition of Done
- toggle de ordenacao funciona com um clique e reaplica filtro imediatamente;
- filtros multi-select mantem chips removiveis e menu recolhivel;
- cada dropdown possui busca interna + limpar selecao;
- resumo de filtros ativos aparece abaixo do formulario;
- typecheck e lint passam sem erro.
