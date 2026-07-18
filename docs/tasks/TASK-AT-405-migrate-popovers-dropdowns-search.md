# TASK-AT-405 - Migracao de popovers, dropdowns e pesquisas

## Metadata
- status: implemented-local-browser-evidence-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-405-migrate-popovers-dropdowns-search.md

## Modo
- mode: implementation

## Objetivo unico
Aplicar a primitive compartilhada nas superficies ativas e padronizar navegacao por teclado conforme o papel semantico de cada controle.

## Contexto minimo
Busca global, notificacoes, emoji, seletor de produtos e menus de navegacao apresentam riscos diferentes de fechamento, foco e click-outside. Migracao deve ser incremental e testada.

## Dependencias
- satisfeitas: TASK-AT-398 e TASK-AT-404.
- em aberto: evidencia manual/Playwright de browser no host alvo; as superficies inventariadas foram migradas localmente.

## Estado reconciliado em 2026-07-18
- NotificationCenter, busca global, menu superior, emoji picker e `ProductQuantitySelector` usam a primitive compartilhada. Testes cobrem outside, blur, Escape, Tab, setas, Home/End, Enter e preservacao de foco; screenshots/browser real permanecem no gate da TASK-AT-411.

## Alvos explicitos
1. NotificationCenter, busca global e menus de navegacao.
2. Emoji picker e ProductQuantitySelector.
3. Novos seletores de Escalas/Avisos e demais overlays ativos inventariados.

## Fora de escopo
- Uniformizar aparencia de todos os controles.
- Transformar tabela/calendario em dropdown.

## Checklist
1. Classificar cada overlay como dialog, menu ou combobox/listbox.
2. Migrar click-outside, Escape, foco e aria sem regressao de acao.
3. Adicionar setas/Enter/Home/End quando o pattern WAI-ARIA exigir.
4. Garantir um unico overlay superior ativo por contexto quando aplicavel.
5. Remover handlers locais duplicados apos testes.

## Acceptance Criteria
1. Todos os overlays inventariados fecham por outside/Escape e restauram foco.
2. Busca/combobox mantem digitacao e selecao por teclado sem foco perdido.
3. Abrir um menu nao deixa outro sobreposto incoerentemente.
4. Desktop/mobile nao apresentam clipping, overflow ou acao de fundo acidental.

## Validacao
- comandos/checks: testes parametrizados por superficie, axe, keyboard E2E e screenshots.
- revisao manual: mouse, touch, Tab, Shift+Tab, Escape e setas.

## Riscos
- Migracao em massa alterar semantica de um controle especializado.

## Proximo passo provavel
TASK-AT-406

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: migrar em lotes pequenos mantendo testes por superficie.
