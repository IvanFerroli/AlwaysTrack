# TASK-PRD-003 - Botao Start Climbing na Home

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-PRD-003-start-climbing-button.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- user-experience

## Origem documental
- Pedido explicito do usuario ("mete esse botao de Start Climbing")

## Objetivo unico
Adicionar um botao "Start Climbing (Run Scraper)" na tela principal do Dashboard, que faca um POST na rota do scraper em uma nova tab.

## Contexto minimo
Com a funcionalidade "all" no scraper, rodar via curl e pratico mas pouco visual para um MVP funcional. Um botao na UI de "Quick Actions" ajuda o fluxo.

## Inputs
- `apps/web/src/features/dashboard/render-dashboard.ts`

## Dependencias
- satisfeitas: TASK-PRD-001, TASK-PRD-002, TASK-SCR-003
- em aberto: n/a

## Alvos explicitos
1. Modificar secao de `Quick Actions` no `render-dashboard.ts`

## Checklist
1. Inserir tag `<form action="/v1/scraper/run" method="POST" target="_blank">` no HTML.
2. Renderizar botao estilisado com verde chamativo e label "🚀 Start Climbing (Run Scraper)".

## Acceptance Criteria
1. O botao aparece no dashboard sob a secao "Quick Actions".
2. Clicar no botao abre uma nova aba e realiza o scraping multi-fonte.

## Handoff
- handoff_to: olympus-orchestrator
