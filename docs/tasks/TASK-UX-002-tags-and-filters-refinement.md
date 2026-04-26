# TASK-UX-002 - Refinamento de Tags e Filtros do Dashboard

## Metadata
- id: TASK-UX-002
- capability: dashboard-ux
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-26
- source-of-truth: code + local gates + user feedback

## Objetivo
Melhorar a experiência do usuário (UX) no dashboard, permitindo a remoção/reset de status (Apply/Discard) e facilitando a múltipla seleção nos filtros sem necessidade de teclas auxiliares.

## Contexto
O usuário reportou que:
1. Uma vez aplicada a tag de "Applied" ou "Discarded", não há como removê-la ou voltar ao estado inicial ("new").
2. Os filtros multi-select são difíceis de usar porque não permitem seleção múltipla intuitiva (provavelmente dependem de Ctrl/Cmd).

## Alvos
- `apps/web/src/features/dashboard/render-dashboard.ts` (HTML e scripts inline)

## Checklist
- [x] Adicionar botão de "Reset" ou "Clear" status nos cards de vaga (botão × na badge).
- [x] Implementar comportamento de toggle para os botões "Apply" e "Discard".
- [x] Melhorar o script `setupCompactDropdowns` para permitir múltipla seleção via clique simples (toggle).
- [x] Ajustar o estilo visual para refletir o estado de seleção nos dropdowns compactos.
- [x] Unificar filtro de "Busca" com "Tags" (híbrido: tags manuais + skills detectadas).

## Critérios de Aceite
- [x] Ao clicar no "×" da badge de status, a vaga volta para "new".
- [x] Nos filtros do dashboard, clicar em múltiplas opções as seleciona sucessivamente (toggle) sem desmarcar as anteriores.
- [x] O visual das opções selecionadas nos dropdowns é claro e acumulativo.
- [x] O filtro de tags aplica lógica de OR (mostrar vagas que tenham QUALQUER uma das tags/skills selecionadas).

## Verificação
- [x] Teste manual via browser: verificado reset de status via botão ×.
- [x] Teste manual via browser: verificado seleção múltipla (toggle) e display de tags acumuladas.
- [x] Backend: verificado que o filtro de tags agora busca simultaneamente em `tags` e `normalizedTokens` com lógica OR.
