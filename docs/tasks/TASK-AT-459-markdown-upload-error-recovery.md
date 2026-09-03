# TASK-AT-459 - Exibir erro e recuperação no upload Markdown

## Metadata
- status: completed-with-risk
- pipeline: DONE — implementado, validado pelo Quality Builder (PASS, 6/6 checks) e aprovado por Task Verifier fresh (2026-09-03); risco registrado: confirmação visual do erro renderizado adiada por limitação do harness (ATUX-012/HIST-013), readquirir após TASK-AT-464
- classified-by: olympus-taskyfier run #1 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-005` (P0 do Grupo B)
- owner: Runtime Builder Web
- verifier: Task Verifier fresh e independente (sem auto-aprovação do builder)
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-459-markdown-upload-error-recovery.md
- mode: implementation
- priority: P0
- severity: high
- confidence: medium
- estimated-effort: 4-6h
- execution-order: 1, primeira task executável do pipeline (antes de TASK-AT-458 para serializar mudanças no mesmo componente)

## Objetivo único
Quando o upload de imagem do `MarkdownEditor` falhar, apresentar erro local e anunciado, preservar o conteúdo e permitir selecionar novamente o mesmo arquivo para um retry seguro.

## Contexto e evidência referenciada
O finding `UX-C02` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` identificou na fonte que `uploadImage` usa `try/finally`, limpa o input e encerra loading, mas não captura a rejeição nem renderiza erro. `TASK-AT-101` já exigia comportamento de erro; `TASK-AT-108/146/151` fecharam segurança, lifecycle e backend, não o feedback local compartilhado. `TASK-AT-340` cobre caminho negativo nas views Wiki/Notas, mas não a rejeição e o retry do `MarkdownEditor` em seus cinco consumidores.

As imagens `INS-C004-C008`, `INS-C012`, `INS-C017` e `INS-C018` apenas contextualizam o editor; não provam o estado de erro. Não copiar/promover PNG advisory. A falha deve ser reproduzida sinteticamente na execução desta task.

## Escopo
1. Adicionar estado de erro local em `apps/web/src/components/markdown-editor.tsx` para rejeição de `onUploadImage`.
2. Anunciar loading/erro/recuperação com semântica apropriada e microcopy acionável já compatível com o produto.
3. Preservar valor, seleção e Markdown até o sucesso.
4. Limpar o input de modo que o mesmo arquivo possa ser selecionado novamente.
5. Cobrir erro e retry no componente compartilhado; adaptar CSS apenas para mensagem local.

## Fora de escopo
- Alterar validação de magic bytes, limites, API, storage ou permissão.
- Inventar códigos de erro que o callback/API não fornece; quando não houver distinção, usar fallback honesto.
- Adicionar barra percentual, múltiplos arquivos ou drag-and-drop.
- Fundir DANFE, CSV de profissionais, licença pública ou reordenação `TASK-AT-153`.

## Dependências
- satisfeitas: contratos `TASK-AT-101`, `108`, `146`, `150`, `151`; callbacks Web atuais.
- resolvida em 2026-09-03 (Taskyfier run #1, verificação de código em HEAD `3088088a`): as rejeições de `uploadWikiImage` e `uploadOperationalImage` chegam pelo helper compartilhado `api()` (`apps/web/src/api.ts`), que lança `new Error(payload.error.message)` quando `payload.ok` é falso. O shape real é `Error` com mensagem do servidor, sem causa tipada — diferenciar tipo/tamanho só é possível se a própria mensagem do servidor distinguir; caso contrário, fallback honesto (critério de aceite 5).
- em aberto (não bloqueia implementação): fechamento visual do estado de erro em browser depende de file step no harness Product UX (`ATUX-012`/`HIST-013`); é aquisição adiada (ver Validação), não pré-requisito desta task.

## Matriz de estados

| Estado | Resultado esperado |
|---|---|
| idle | botão disponível, sem mensagem obsoleta |
| loading | botão ocupado/desabilitado e estado anunciado |
| invalid-type/size | mensagem contextual quando a rejeição real permitir distinguir a causa |
| 4xx/5xx/network | fallback visível e anunciado, sem alegar causa inexistente |
| error | conteúdo/seleção preservados; nada inserido |
| retry | mesmo arquivo pode ser escolhido outra vez |
| success-after-retry | Markdown inserido exatamente uma vez e erro anterior removido |
| cancel | nenhuma mensagem de erro e nenhuma mudança no conteúdo |

## Critérios de aceite
1. Rejeição do callback não produz promise não tratada e encerra o estado `Enviando...`.
2. Erro aparece junto ao editor e é anunciado sem exigir mudança de foco.
3. Texto e seleção do editor permanecem inalterados após falha.
4. O mesmo arquivo pode ser selecionado novamente; sucesso posterior insere Markdown uma única vez.
5. Mensagem distingue tipo/tamanho somente quando o contrato real fornece essa causa; demais falhas usam fallback seguro.
6. Wiki, FAQ, Fluxos, Scriptoteca e Avisos mantêm upload bem-sucedido e permissões vigentes.

## Validação (gate de aceite desta task)
- Vitest focal do `MarkdownEditor`, determinístico, dirigindo o input de arquivo com `File` sintético e callback mockado: loading, rejeição genérica, causa conhecida quando a mensagem do servidor distinguir, retry com mesmo arquivo, sucesso único e cancelamento.
- Testes existentes de Wiki/API e ao menos um consumidor de `uploadOperationalImage`.
- Web typecheck/build, suíte focal de Vitest e `git diff --check`.
- Suítes browser são alvo focal e opcional, nunca gate global: existem 10 falhas E2E browser pré-existentes em `main` (`HIST-016`); o aceite NÃO exige suíte e2e globalmente verde. Se o builder acrescentar cenário browser, usar suíte focal isolada e comparar falhas restantes contra o baseline de `main` (ex.: `git stash`/rerun) para provar que são pré-existentes.

## Validação adiada (fora do gate desta task)
- Evidência browser/visual do estado de erro renderizado (screenshot task-backed + live region em browser real) fica para aquisição posterior, desbloqueada pelo file step no harness (`ATUX-012`/`HIST-013`). A implementação e o aceite desta task são fecháveis por testes unitários/estruturais + código; não usar essa lacuna como motivo para bloquear a task.

## Riscos
- Exibir `Error.message` bruto pode vazar detalhe técnico; normalizar para mensagens permitidas.
- Estado assíncrono concorrente pode inserir upload antigo após retry; manter uma tentativa ativa por editor.
- Limpar erro cedo demais remove orientação; tarde demais anuncia falha após sucesso.

## Limitações
- A severidade é alta pelo impacto potencial, mas a confiança é média porque o audit não reproduziu rejeição no browser.
- Tipo/tamanho podem ser rejeitados no backend com mensagem indistinta; esta task não altera o contrato HTTP sem nova evidência.
- Mobile/touch e providers externos não foram auditados.
- O estado de erro não terá evidência visual de browser nesta task (harness sem file step, `ATUX-012`/`HIST-013`); validar o render real em browser é follow-up task-backed, não bloqueio de implementação.
- A suíte e2e browser tem 10 falhas pré-existentes em `main` (`HIST-016`); nenhuma aceitação desta task pode depender de suíte global verde.

## Definição de pronto
- Todos os estados da matriz têm teste determinístico, erro/retry são observáveis e nenhum consumidor do editor regride.

## Verificação independente final — 2026-09-03
- veredito: `approved`; validação fresh e independente, re-derivada do código e dos gates executados localmente nesta data (Task Verifier sem participação na implementação).
- escopo confirmado: `git status --short` + `git diff --numstat` mostram como alteração de produto apenas `apps/web/src/components/markdown-editor.tsx` (+21/−1) e o novo `apps/web/test/markdown-editor.test.tsx` (não rastreado, 7 testes); demais mudanças do worktree estão sob `docs/` (lane Taskyfier concorrente) e no diretório não rastreado `.claude/` (tooling, fora do escopo do produto). Nenhum arquivo de teste pré-existente foi modificado.
- AC1 atendido: `catch` captura a rejeição (`setUploadError(imageUploadMessage(error))`) e o `finally` mantém `uploadActiveRef.current = false`, `setUploadingImage(false)` e a limpeza do input; a promessa nunca rejeita para o chamador `void uploadImage(...)`. Sonda de mutação: com `throw error` reinjetado no `catch`, a suíte focal registrou 5 unhandled rejections e falhou (exit 1); após o edit exato inverso, `git diff --numstat` retornou a `21 1` e a suíte voltou a 7/7.
- AC2 atendido: erro renderizado como `<p className="error" role="alert">` dentro de `.wiki-editor`, junto ao editor, sem chamada de foco; o teste asseri `not.toHaveFocus()`. Loading anunciado por `<span className="sr-only" aria-live="polite">` (desvio aceito, ver abaixo).
- AC3 atendido: no caminho de falha nada escreve no textarea (nenhum `onChange`/`setSelectionRange` no `catch`/`finally`); o teste asseri valor e seleção (0–8) preservados após a rejeição.
- AC4 atendido: o `finally` limpa `imageInputRef.current.value = ""` (asserido após sucesso e após falha nos testes), permitindo reselecionar o mesmo arquivo; o teste de retry seleciona o mesmo `File` duas vezes, o callback é chamado 2× com o mesmo arquivo e o Markdown é inserido uma única vez.
- AC5 atendido: o normalizador `imageUploadMessage` casa com as mensagens reais do servidor via `api()` (`throw new Error(payload.error.message)` em `apps/web/src/api.ts`): `unsupported`+`type` cobre "Unsupported attachment type." (operacional) e "Unsupported wiki attachment type." (wiki); `too large` cobre "Attachment is too large." e "Wiki attachment is too large." (`services/api/src/core/attachments/operational-attachments.handlers.ts` e `services/api/src/core/wiki/wiki.handlers.ts`); demais causas usam o fallback honesto, coberto por teste com "Internal Server Error" e rejeição não-`Error` ("boom").
- AC6 atendido: os cinco consumidores (Wiki, FAQ, Fluxos, Scriptoteca, Avisos) mantêm o contrato de `onUploadImage` inalterado e possuem suítes próprias; suíte web completa verde (ver gates).
- gates executados: focal 7/7 (exit 0); suíte web completa 29 arquivos / 180 testes (exit 0); typecheck exit 0; build exit 0 (aviso >500kB é baseline pré-existente, não é finding); `git diff --check` limpo.
- guard de concorrência: `uploadActiveRef` impede segunda tentativa enquanto há upload ativo; teste dedicado confirma seleção concorrente ignorada e inserção única.
- desvios aceitos: (a) sem CSS novo — `.error` (styles.css:4854) e `.sr-only` (styles.css:166) já existiam; (b) live region com `aria-live="polite"` sem `role="status"` — `announcements.test.tsx:334` usa `findByRole("status")` singular e `announcements.tsx:694` já renderiza `role="status"` próprio na mesma view que monta o editor com upload; um segundo `role="status"` persistente tornaria a consulta ambígua. Leitura confirmada no código e nos testes; mecanismo de colisão é real.
- limites não bloqueantes: evidência browser/visual do estado de erro permanece adiada conforme a própria task (`ATUX-012`/`HIST-013`); as 10 falhas E2E browser pré-existentes em `main` (`HIST-016`) seguem fora do gate. A mecânica "reselecionar o mesmo arquivo dispara change" é contrato de browser; no nível unitário o que é asserido é a limpeza do input (comportamento do componente), suficiente para o gate definido.

## Sugestão de commit semântico
- `fix(web): adiciona erro e retry ao upload markdown`
