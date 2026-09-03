# TASK-AT-458 - Remover controle invisível do picker de imagem Markdown

## Metadata
- status: ready-to-execute
- pipeline: READY_TO_EXECUTE
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-004` (Grupo B). Vigência reconfirmada em código no HEAD `3088088a`: `apps/web/src/components/markdown-editor.tsx:383-392` (input invisível sem nome) e `apps/web/src/styles.css:4845-4852` (`.visually-hidden-input`) permanecem como descrito.
- owner: Runtime Builder Web
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-458-markdown-image-picker-accessibility.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 2-4h
- execution-order: 2, após TASK-AT-459 para evitar colisão no mesmo componente

## Objetivo único
Manter um único gatilho acessível para abrir o picker de imagem do `MarkdownEditor`, sem input invisível e sem nome no percurso de teclado ou na árvore de acessibilidade.

## Contexto e evidência referenciada
O finding `UX-C01` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` correlacionou `unnamed-interactive` com o `input[type=file]` de 1px do `MarkdownEditor`. O botão `Imagem` já aciona esse input programaticamente, mas o input permanece focável e sem nome. O componente é compartilhado por Wiki, FAQ, Fluxos, Scriptoteca e Avisos.

Referências advisory: `INS-C004-C008`, `INS-C012`, `INS-C017` e `INS-C018`. As capturas são transitórias e não devem ser copiadas ou promovidas; qualquer evidência de aceite deve ser readquirida no lane task-backed.

## Escopo
1. Ajustar `apps/web/src/components/markdown-editor.tsx` para haver um único gatilho nomeado e operável por teclado.
2. Ajustar a técnica de ocultação em `apps/web/src/styles.css` apenas se necessário, sem criar segundo tab stop.
3. Preservar `accept`, seleção de um arquivo, loading e callback `onUploadImage`.
4. Adicionar teste focal do componente e smoke nos cinco consumidores compartilhados.

## Fora de escopo
- Adicionar drag-and-drop (`TASK-AT-460`).
- Implementar feedback/retry de erro (`TASK-AT-459`).
- Alterar validação, storage, permissões ou anexos de DANFE/CSV/licença pública.

## Dependências
- satisfeitas: `TASK-AT-101`, `108`, `146`, `151` e `457`; `MarkdownEditor` compartilhado ativo.
- em aberto: nenhuma. Executar depois de `TASK-AT-459` apenas para serializar mudanças no mesmo arquivo.

## Matriz de estados

| Estado | Resultado esperado |
|---|---|
| default | somente o botão de imagem aparece como controle acessível |
| keyboard | Tab alcança o botão, nunca um input invisível sem nome |
| picker-open | Enter/Space/clique no botão abre o diálogo nativo |
| cancel | fechar/cancelar não altera conteúdo nem cria tab stop residual |
| loading | botão continua sendo o único controle e comunica indisponibilidade |
| success | callback recebe um arquivo e o Markdown é inserido uma vez |

## Critérios de aceite
1. Com `onUploadImage`, a toolbar tem exatamente um gatilho acessível para imagem.
2. A ordem de Tab não alcança controle invisível ou sem nome.
3. O gatilho abre o picker por mouse, Enter e Space e permanece nomeado durante loading.
4. Cancelar o diálogo não muda o conteúdo; o foco permanece ou retorna ao gatilho/textarea conforme comportamento verificável do browser.
5. O check automatizado retorna zero `unnamed-interactive` atribuível ao editor em Wiki, FAQ, Fluxos, Scriptoteca e Avisos.

## Validação
- Vitest em `apps/web/test/accessibility.test.tsx` com `MarkdownEditor` e `onUploadImage`.
- Teste focal de upload bem-sucedido e cancelamento sem alteração.
- Playwright task-backed em ao menos um consumidor e smoke DOM nos cinco consumidores.
- Teclado manual no diálogo nativo; Web typecheck/build, suíte focal e `git diff --check`.

## Riscos
- Remover o input da árvore de forma incorreta pode impedir o diálogo de abrir em alguns browsers.
- Mover foco manualmente após cancelamento pode competir com o comportamento nativo.
- Patch no componente compartilhado afeta todos os editores, inclusive múltiplas instâncias na mesma tela.

## Limitações
- O audit não exercitou diálogo nativo, leitor de tela ou mobile/touch.
- O aceite não declara paridade entre Chromium, Safari e Firefox sem execução correspondente.

## Definição de pronto
- Componente e cinco consumidores ficam sem controle invisível/sem nome, testes passam e evidência task-backed substitui a referência advisory.

## Sugestão de commit semântico
- `fix(web): torna picker markdown acessivel por um unico gatilho`
