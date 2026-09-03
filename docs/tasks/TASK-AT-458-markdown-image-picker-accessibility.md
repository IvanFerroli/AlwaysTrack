# TASK-AT-458 - Remover controle invisível do picker de imagem Markdown

## Metadata
- status: completed-with-risk
- pipeline: DONE — implementado, validado pelo Quality Builder (PASS-WITH-NOTES) e aprovado com notas por Task Verifier fresh (2026-09-03); desvio aceito e documentado (cobertura component-level em vez de accessibility.test.tsx); parcela e2e/Playwright + smoke nos 5 consumidores registrada como pendência DoD (evidence-debt, desbloqueia com TASK-AT-464)
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

## Verificação independente final — 2026-09-03
- veredito: `approved-with-notes`; validação fresh e independente, re-derivada do código e dos gates executados localmente nesta data (Task Verifier sem participação na implementação; implementação não commitada, HEAD `00a8ed79`).
- escopo confirmado: `git status --short` + `git diff --numstat` mostram como alteração de produto apenas `apps/web/src/components/markdown-editor.tsx` (+5/−0: comentário de 3 linhas, `aria-hidden="true"`, `tabIndex={-1}`) e `apps/web/test/markdown-editor.test.tsx` (+83/−1; a única deleção é a linha de import). Demais mudanças do worktree estão sob `docs/` (lane concorrente) e `.claude/` (tooling). `styles.css` intocado — ajuste de ocultação não foi necessário (escopo item 2 dizia "apenas se necessário"); `.visually-hidden-input` (styles.css:4845-4852) já usa 1px + `pointer-events: none`, que com `aria-hidden` + `tabIndex={-1}` mantém o input renderizado para o clique programático.
- não-regressão TASK-AT-459: corpo pré-existente do arquivo de teste é byte-idêntico ao HEAD (`git show HEAD:` comparado contra o arquivo atual; únicas diferenças = linha de import e bloco novo); os 7 testes `MarkdownEditor upload` permanecem intactos; `uploadImage` (markdown-editor.tsx:306) não é tocada pelo diff.
- AC1 atendido: a toolbar tem exatamente um gatilho nomeado "Imagem" (`within(toolbar).getAllByRole("button", { name: "Imagem" })).toHaveLength(1)`) e nenhum outro input acessível (`toolbar.querySelectorAll("input")` = [fileInput]).
- AC2 atendido (comportamental): `user.tab()` a partir do botão "Imagem" move o foco direto ao textbox "Conteudo", provando que o input invisível não é tab-stop; asserções estruturais `aria-hidden="true"` e `input.tabIndex === -1` complementam (não substituem).
- AC3 atendido: clique, `{Enter}` e espaço via userEvent disparam `HTMLInputElement.prototype.click` exatamente 3×, com contexto igual ao fileInput (`pickerSpy.mock.contexts[0]`); durante o envio o controle nomeado persiste (`getByRole("button", { name: "Enviando..." })` desabilitado) e volta a "Imagem" habilitado após o sucesso.
- AC4 atendido: cancelamento coberto pelo teste pré-existente "seleção cancelada sem arquivo..." (change com arquivos vazios → callback não chamado, conteúdo preservado, sem alerta); retorno de foco após diálogo nativo é comportamento do browser, reconhecido nas Limitações da task.
- AC5 atendido com desvio documentado (ver registro abaixo): no nível do componente, zero interativos sem nome — loop sobre `button, input, select, textarea` exige nome em todos, e o único controle dentro de `[aria-hidden='true']` é o próprio fileInput; os cinco consumidores renderizam o mesmo `MarkdownEditor` (wiki.tsx ×2, faq.tsx ×2, service-flows.tsx ×3, script-library.tsx ×2, announcements.tsx ×1 — 10 mount points), então a cobertura componhe para Wiki, FAQ, Fluxos, Scriptoteca e Avisos.
- sonda de mutação: com `tabIndex={-1}` removido por edit preciso (reverso exato aplicado na sequência, sem uso de stash/restore/checkout/clean), a suíte focal falhou 1/10 (`expected +0 to be -1` em `input.tabIndex`) com os outros 9 testes verdes; após a reversão, o `git diff` retornou byte-idêntico (patch pré/pós comparado com `diff`) e a focal voltou a 10/10. Nota honesta: a asserção que disparou foi a de atributo `tabIndex` (precede a asserção de travessia de Tab no mesmo corpo de teste); o gate da suíte segurou a mutação, e a asserção comportamental permanece como segunda camada de defesa.
- gates executados: focal `test/markdown-editor.test.tsx` 10/10 (exit 0); suíte web completa 29 arquivos / 183 testes (exit 0); typecheck exit 0; build exit 0 (aviso >500kB é baseline pré-existente, não finding); `git diff --check` limpo.
- desvio aceito (registro da decisão do verifier): o plano de Validação pedia cobertura em `apps/web/test/accessibility.test.tsx` + smoke nos cinco consumidores; a implementação entrega cobertura componente-nível em `markdown-editor.test.tsx`. Fatos re-verificados nesta verificação: (a) `accessibility.test.tsx` monta `MarkdownEditor` somente SEM `onUploadImage` (linhas 38/64/76) e o input só renderiza dentro de `{onUploadImage ? ... : null}` (markdown-editor.tsx:399) — o helper nunca viu o input antes nem depois; (b) `hasLabel()` (`apps/web/test/accessibility-assertions.ts:11`) não consulta `aria-hidden`, então conformidade literal exigiria alterar o helper compartilhado — mudança cross-cutting fora do escopo desta task; (c) todos os cinco consumidores renderizam o mesmo componente. Decisão: ACEITO como desvio documentado — o objetivo do AC5 é cumprido por composição, com cobertura focal mais forte que a planejada; não há enfraquecimento de critério.
- parcela de DoD adiada (não bloqueante, dívida de evidência): evidência e2e/Playwright task-backed em ao menos um consumidor + smoke DOM por consumidor segue em aberto e fica registrada no bucket evidence-debt do audit — `ATUX-004` já carrega `runtime_revalidation_required: true (pós-fix)`; padrão análogo a ATUX-014/ATUX-015. Executar quando o harness Product UX suportar file step (`ATUX-012`/`HIST-013`).
- limites não bloqueantes: diálogo nativo, leitor de tela e mobile/touch não exercitados (Limitações da task); paridade entre browsers não declarada sem execução correspondente.

## Sugestão de commit semântico
- `fix(web): torna picker markdown acessivel por um unico gatilho`
