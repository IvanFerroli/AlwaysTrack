# TASK-PRD-006 - Frontend: UI de Filtros e Ações de Vaga

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-24

## Modo
- mode: planning

## Objetivo unico
Implementar na interface do Dashboard os controles de busca, filtros avançados e os botões de ação para descartar ou aplicar para vagas.

## Contexto minimo
Com a fundação pronta na API e Tipos, o Dashboard precisa de uma barra de ferramentas acima da listagem de afinidade. Como o frontend usa HTML renderizado do lado do servidor (SSR simples), a barra de filtros será um `<form>` com `GET` apontando para a própria rota do dashboard, que repassará os query params para a API. As ações de mutação de tag usarão requisições fetch (via JS client-side leve) ou forms escondidos.

## Alvos explicitos
1. Adicionar barra de filtros (Input de texto, Select de Status, Select de Min Score) em `render-dashboard.ts`.
2. Repassar os query strings do request do usuário no `apps/web/src/main.ts` para a chamada do `loadDashboardData()`.
3. Adicionar botões de ação nas vagas listadas ("Marcar como Aplicada", "Descartar").
4. Mostrar badgets de status/data em cada vaga.

## Definition of Done
- UI do Dashboard possui controles visuais de filtro.
- URL da home respeita query params de filtro e atualiza a listagem.
- Usuário consegue descartar uma vaga direto da UI.
