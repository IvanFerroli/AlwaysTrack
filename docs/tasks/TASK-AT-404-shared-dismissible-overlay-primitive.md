# TASK-AT-404 - Primitive compartilhada de overlay dismissible

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-404-shared-dismissible-overlay-primitive.md

## Modo
- mode: implementation

## Objetivo unico
Criar contrato compartilhado para popover, dropdown e pesquisa com click-outside, Escape, foco inicial/restaurado e camadas aninhadas.

## Contexto minimo
NotificationCenter trata Escape/foco, enquanto busca global, menu de emoji e seletores possuem implementacoes distintas e em geral nao fecham por click-outside.

## Dependencias
- satisfeitas: inventario da TASK-AT-391 e testes Web existentes.
- em aberto: escolher helper interno ou primitive da biblioteca ja instalada, sem nova dependencia desnecessaria.

## Alvos explicitos
1. Hook/component de dismissible layer e stack de overlays.
2. Contratos de trigger, aria, foco e eventos pointer/keyboard.
3. Test harness compartilhado.

## Fora de escopo
- Reescrever modal/dialog completo.
- Fechar select nativo ou tooltip meramente informativo.

## Checklist
1. Fechar em `pointerdown` fora sem fechar ao interagir dentro/trigger.
2. Escape fecha apenas a camada superior e restaura foco ao trigger valido.
3. Definir foco inicial, retorno, unmount e trigger removido/disabled.
4. Tratar portal, camada aninhada, touch e scroll sem listener vazando.
5. Expor semantica distinta para menu, listbox/combobox e dialog.

## Acceptance Criteria
1. Primitive possui testes para outside, inside, Escape, foco e nested layers.
2. Listener e removido no unmount e nao duplica por rerender.
3. Comportamento funciona por mouse, touch e teclado.
4. API nao obriga role/aria incorreto para todos os tipos de overlay.

## Validacao
- comandos/checks: testes unit/componentes, accessibility assertions, typecheck/build Web e `git diff --check`.
- revisao manual: nested overlay e trigger removido durante fechamento.

## Riscos
- Click-outside no evento errado disparar primeiro a acao do elemento de fundo.

## Proximo passo provavel
TASK-AT-405

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: primitive pequena, acessivel e sem abstracao visual excessiva.
