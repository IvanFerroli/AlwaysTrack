# EXEC-AT-074 - Polimento visual por print: Scriptoteca

## Metadata
- status: completed-screenshot-slice
- task: docs/tasks/TASK-AT-074-final-visual-polish-by-real-screenshots.md
- completed: 2026-06-19

## Input
- Print real enviado pelo usuario em 2026-06-19 mostrando Scriptoteca/Atendimento com sidebar, filtros, chips, roteiros, scripts e preview.

## Entrega
- Ajustada a marca da sidebar para evitar quebra dentro de `ALWAYSTRACK`.
- Compactados itens da sidebar para reduzir corte do rodape do menu.
- Rebalanceada a grade da Scriptoteca de atendimento.
- Estabilizados cards de roteiros com coluna fixa para `Editar`.
- Ajustadas quebras de texto em cards/listas.
- Avisos de canal agora usam bloco compacto em vez de pill alongado.
- Layout da Scriptoteca passa a empilhar abaixo de 1280px para evitar sobreposicao.

## Arquivos
- `apps/web/src/styles.css`
- `docs/tasks/TASK-AT-074-final-visual-polish-by-real-screenshots.md`
- `docs/tasks/ROADMAP.md`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

## Ressalva
- Screenshot Playwright nao rodou porque o Chromium local falha com `libnspr4.so` ausente. A falha e ambiental e ja faz parte da trilha conhecida de Playwright/CI.
