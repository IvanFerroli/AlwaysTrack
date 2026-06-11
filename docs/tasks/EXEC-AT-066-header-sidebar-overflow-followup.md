# EXEC-AT-066 - Header/sidebar overflow follow-up

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-067-header-sidebar-overflow-followup.md

## Objetivo
Executar a rodada corretiva solicitada pelo usuario sobre navegacao, sidebar e cards ainda estourados.

## Entregas
1. `Perfil` foi removido da lista lateral e permanece no topo logo apos `Dashboard`, alem do botao de usuario.
2. Header deixou de usar scrollbar nos atalhos e agora permite quebra dos botoes em linha adicional.
3. Sidebar ganhou botao de recolher/expandir, preservando icones no estado recolhido.
4. Cards de Wiki/FAQ deixam de herdar altura fixa global de botao e passam a crescer conforme o conteudo.
5. Paginacao de Wiki/FAQ ficou visualmente separada dos cards por borda e padding proprios.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npx playwright test tests/e2e/app-smoke.spec.ts --project=desktop` tentou executar, mas o Chromium local falhou antes do teste por dependencia de sistema ausente: `libnspr4.so`.

## Riscos residuais
- O estado de colapso do sidebar ainda e local da sessao atual; persistencia em localStorage pode ser adicionada depois se virar preferencia de produto.
