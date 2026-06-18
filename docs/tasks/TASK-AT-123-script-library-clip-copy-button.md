# TASK-AT-123 - Scriptoteca: clipe de copia rapida

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-123-script-library-clip-copy-button.md

## Modo
- mode: ux-polish

## Objetivo unico
Trocar o botao textual de copia da Scriptoteca por um botao compacto de clipe/clipboard, preservando copia em um clique, feedback visual e registro de uso.

## Contexto
A Scriptoteca ja copiava o script renderizado e registrava evento de copia. O problema observado pelo usuario e ergonomico: no atendimento, o botao deve funcionar como um atalho visual rapido, sem texto ocupando espaco na coluna lateral.

## Escopo
1. Usar icone de clipboard/clipe no painel de detalhe do script.
2. Manter `aria-label` e `title` para acessibilidade.
3. Mostrar feedback visual de sucesso com check.
4. Preservar chamada `POST /v1/script-library/scripts/:scriptId/copy`.

## Fora de escopo
- Alterar placeholder/renderizacao.
- Criar modo compacto completo da Scriptoteca.
- Alterar metricas ou modelo de dados.

## Acceptance Criteria
1. Usuario copia o script clicando apenas no icone.
2. Botao nao estoura layout.
3. Feedback de sucesso aparece sem deslocar a UI.
4. Evento de copia continua sendo enviado ao backend.

## Execucao
- execution-log: docs/tasks/EXEC-AT-123-script-library-clip-copy-button.md
