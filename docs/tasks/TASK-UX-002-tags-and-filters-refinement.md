# TASK-UX-002 - Refinamento de Tags e Filtros do Dashboard

## Objetivo
Melhorar a experiência do usuário (UX) no dashboard, permitindo a remoção/reset de status (Apply/Discard) e facilitando a múltipla seleção nos filtros sem necessidade de teclas auxiliares.

## Contexto
O usuário reportou que:
1. Uma vez aplicada a tag de "Applied" ou "Discarded", não há como removê-la ou voltar ao estado inicial ("new").
2. Os filtros multi-select são difíceis de usar porque não permitem seleção múltipla intuitiva (provavelmente dependem de Ctrl/Cmd).

## Alvos
- `apps/web/src/features/dashboard/render-dashboard.ts` (HTML e scripts inline)

## Checklist
- [ ] Adicionar botão de "Reset" ou "Clear" status nos cards de vaga.
- [ ] Implementar comportamento de toggle para os botões "Apply" e "Discard".
- [ ] Melhorar o script `setupCompactDropdowns` para permitir múltipla seleção via clique simples (toggle).
- [ ] Ajustar o estilo visual para refletir o estado de seleção nos dropdowns compactos.

## Critérios de Aceite
- [ ] Ao clicar em "Apply" em uma vaga já aplicada, o status deve voltar para "new" (ou haver um botão explícito para isso).
- [ ] Nos filtros do dashboard, clicar em múltiplas opções deve selecioná-las sucessivamente sem desmarcar as anteriores.
- [ ] O visual das opções selecionadas nos dropdowns deve ser claro.

## Verificação
- [ ] Teste manual via browser: verificar se o status da vaga pode ser resetado.
- [ ] Teste manual via browser: verificar se a seleção múltipla nos filtros funciona com cliques simples.
