# TASK-AT-461 - Preservar relação tab/panel no vazio de Escalas

## Metadata
- status: completed
- pipeline: DONE — implementado, validado pelo Quality Builder (PASS) e aprovado por Task Verifier fresh (2026-09-03, VER-TASK-AT-461-20260903-001); sinal browser `active-aria-controls-missing` 1→0 em captura advisory validada; deltas pré-existentes aceitos e documentados
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-007` (Grupo B). Vigência reconfirmada em código no HEAD `3088088a`: `apps/web/src/views/support-schedules.tsx:865` (`aria-controls` incondicional) versus ramos `OperationalState` (linhas 889–898) sem painel correspondente.
- owner: Runtime Builder Web
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-461-schedules-empty-tabpanel-relationship.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 2-4h
- execution-order: 3

## Objetivo único
Garantir que a aba ativa de Escalas sempre controle um `tabpanel` existente e nomeado, inclusive para GESTOR sem equipe selecionada e nos estados loading/error.

## Contexto e evidência referenciada
O finding `UX-C04` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` encontrou `active-aria-controls-missing:1`. Em `apps/web/src/views/support-schedules.tsx`, as tabs sempre apontam para `support-schedules-${key}-panel`, mas o ramo `canManage && !teamId` renderiza `OperationalState` fora de qualquer painel. As tasks amplas `TASK-AT-312/411` não corrigem esse ramo específico.

Referência advisory: `INS-C001`. Não copiar ou promover sua captura; adquirir evidência task-backed.

## Escopo
1. Ajustar o ramo de vazio/loading/error em `support-schedules.tsx` para manter painel coerente com a aba ativa.
2. Preservar o tablist, roving `tabIndex`, setas/Home/End e painéis após selecionar equipe.
3. Adicionar teste focal para GESTOR sem equipe e regressão com equipe/calendário.

## Fora de escopo
- Alterar regra de seleção explícita de equipe, dados, permissões ou layout das escalas.
- Corrigir cenários de Performance bloqueados no audit.
- Redesenhar `OperationalState` ou o contrato global de tabs.

## Dependências
- satisfeitas: `TASK-AT-312`, `394`, `411`; helper `keyboardTabIndex` e testes de Escalas existentes.
- em aberto: nenhuma.

## Matriz de estados

| Estado | Relação esperada |
|---|---|
| sem equipe | aba selecionada aponta para tabpanel com estado vazio |
| roster loading | mesmo painel contém loading |
| roster error | mesmo painel contém erro e descrição disponível |
| equipe selecionada/loading | painel ativo existe durante carregamento do calendário |
| calendário success | alternância de tabs aponta para painel correspondente |
| keyboard | setas/Home/End movem seleção/foco sem relação órfã |

## Critérios de aceite
1. Em todos os estados da matriz, existe exatamente uma aba selecionada.
2. `document.getElementById(activeTab.getAttribute("aria-controls"))` resolve para elemento `role="tabpanel"`.
3. O painel é nomeado pela aba via `aria-labelledby` e contém o estado relevante.
4. Selecionar equipe e alternar abas preserva foco por setas/Home/End e conteúdo correto.
5. O check `active-aria-controls-missing` retorna zero.

## Validação
- Expandir `apps/web/test/support-schedules.test.tsx` para vazio, loading, erro e calendário.
- Teste de teclado/ARIA focal e Playwright task-backed de GESTOR sem equipe.
- Web typecheck/build, Vitest focal e suíte de scheduling proporcional, `git diff --check`.

## Riscos
- Envolver todos os estados num painel fixo pode associar conteúdo à aba errada quando `tab` muda.
- Renderizar tabpanel duplicado durante transição pode quebrar o critério de aba única.
- Mudança no ramo de erro pode ocultar retry ou descrição existente.

## Limitações
- O audit cobriu um viewport desktop fake e não executou leitor de tela real.
- Outros componentes de tabs não fazem parte deste escopo.

## Definição de pronto
- Toda a matriz passa sem referência ARIA órfã, teclado não regride e evidência task-backed é revisada.

## Verificação independente final — 2026-09-03
- veredito: `approved`. Verificação fresh e independente (Task Verifier sem participação na implementação), re-derivada de leitura estática do diff, comparação mecânica de conteúdo, execução própria de todos os gates e mutation probe nesta data. HEAD `ead9318e`; implementação não commitada (dirty worktree). Verification ID: `VER-TASK-AT-461-20260903-001`; execution related: advisory `UXREQ-AT461-REVALIDATE-20260903-001`.
- escopo confirmado: `git status --porcelain` mostra como superfície rastreada exatamente os 2 arquivos reivindicados: `apps/web/src/views/support-schedules.tsx` (+24/−15) e `apps/web/test/support-schedules.test.tsx` (+147/−0, puramente aditivo; helper + 5 testes novos; 8 pré-existentes intactos). Não-rastreados extras (`.claude/`, `docs/operations/HANDOFF-product-ux-heavy-verification-2026-09-03.md`, `docs/tasks/TASK-AT-453-product-ux-active-promotion-gate.md`) pertencem a outros lanes — não atribuídos a esta task. Diff da view contém só 2 hunks: o novo fallback wrapper e o fechamento do ramo calendar; tablist (linhas 857–881) e ramo calendar (888–1225) sem nenhum hunk.
- conteúdo preservado (prova mecânica): comparação normalizada por indentação do bloco antigo (HEAD, linhas 889–900) contra o bloco novo (working, linhas 1234–1246, dentro do wrapper): byte-idêntico em todos os `OperationalState`/retry (props, títulos, detalhes, botão "Tentar novamente"). Únicas diferenças: as linhas de condição (`) : loading && !calendar ? (` → `) : loading ? (`; `) : !calendar && error ? (` → `) : error ? (` — `!calendar` implícito pela ordem calendar-primeiro) e o `: null` final movido para dentro do wrapper. Única diferença comportamental alcançável em estado estacionário é o delta (b) abaixo.
- AC1 atendido (exatamente uma aba selecionada em todos os estados): `aria-selected={tab === key}` sobre `visibleTabs` com chaves únicas por papel (sacTabs week/extras/exchanges; managerTabs coverage/pending/management); helper `expectActiveTabPanelRelationship()` afirma `toHaveLength(1)` nos 5 testes novos, cobrindo todos os ramos da matriz.
- AC2 atendido (`getElementById(aria-controls)` resolve para `role="tabpanel"`): o fallback renderiza `id=support-schedules-${tab}-panel` com `role="tabpanel"` em todos os ramos não-calendar (vazio GESTOR, roster loading/error, calendar loading/error); no ramo calendar exatamente o painel da aba ativa renderiza (gates `!canManage`/`canManage` disjuntos por papel; `tab` sempre do conjunto visível). Sem ids de painel duplicados: ramos calendar/fallback mutuamente exclusivos (`calendar ? <>…</> : <div…>`).
- AC3 atendido (painel nomeado pela aba e com o estado relevante): wrapper define `aria-labelledby=support-schedules-${tab}-tab`; testes afirmam o conteúdo por estado — "Selecione uma equipe" (vazio), "Carregando equipes", "Equipes indisponíveis" + detalhe (erro de roster), "Carregando a semana", "Escala indisponível" + detalhe + retry (erro de calendar), headings do calendar.
- AC4 atendido (seleção de equipe e teclado sem regressão): testes novos 1 e 5 cobrem ArrowRight/End/Home com a relação reafirmada a cada passo e foco verificado; `keyboardTabIndex` e o handler do tablist intocados (sem hunk).
- AC5 atendido (`active-aria-controls-missing` zero): cenário mobile `gestor-escalas-empty-mobile-revalidate-461` no advisory `UXREQ-AT461-REVALIDATE-20260903-001` = accessibility `passed` com `criticalIssueCounts: {}`, mesmo estado (`gestor-no-team-empty`) e viewport (390×844) do cenário pré-fix `gestor-escalas-empty-mobile` em `UXREQ-ALWAYSTRACK-REPO-WIDE-AUDIT-20260903-001`, que registrava `active-aria-controls-missing: 1`. Complemento determinístico: `expectNoCriticalAccessibilityViolations` nos containers de vazio, erro de roster e retry.
- gates re-executados nesta verificação: focal `vitest run test/support-schedules.test.tsx` = 13/13; suíte web completa = 188/188 (29 arquivos); `typecheck` exit 0; `build` exit 0; `git diff --check` limpo; harness `node --test tests/product-ux/visual-harness.test.mjs` = 24/24.
- mutation probe (load-bearing confirmado): wrapper fallback substituído in-place por fragment via edições exatas (sem git stash/restore/checkout/clean): focal passou a 4 failed / 9 passed — as 4 falhas são precisamente os testes de relação dos ramos fallback (vazio, roster loading/error, calendar loading, calendar error); o teste de teclado do ramo calendar e os 8 pré-existentes permanecem verdes, provando que o wrapper é o elemento load-bearing e que os testes são sensíveis à regressão. Revertido com as edições inversas exatas: diff restaurado para +24/−15 e focal de volta a 13/13.
- ruling do advisory: validator = `valid-advisory-record` (exit 0; `resultCode: ADVISORY_ACQUISITION_BLOCKED` pelo flake de setup no desktop; classification `fake`; 2 cenários/2 artefatos; sha256 dos 2 PNGs conferidos localmente). Papel evidenciário: contexto corroborativo TRANSITÓRIO apenas — `usagePolicy` same-request-only, `promotable: false`, `reusable: false`, `gateClosureAllowed: false`; `retentionPolicy` transient-request com disposeOn `request-closed`; descarte no fechamento do request é CORRETO pela política. Evidência primária de aceite é determinística (suíte rastreada); o advisory agrega confirmação browser-level do AC5 (mobile) e não é promovível a evidência canônica.
- ruling do gap desktop: cobertura determinística SUPRE o gap. (i) O attempt desktop PRÉ-fix deste mesmo cenário também registrou `setup-incomplete: 1` — nunca houve captura desktop válida, logo não há sinal pré/pós comparável; (ii) o mesmo `setup-incomplete` aparece em vários cenários desktop não relacionados no registro pré-fix (gestor-performance-desktop, admin-performance-desktop, revalidate-455-desktop-control, users-empty-search-1440, sac-dashboard-terminal-mobile, users-deactivate-confirm-1440) e o audit documenta o blocker GESTOR desktop como passo de navegação/terminal, não de auth — flake ambiental sem sinal sobre o componente; (iii) a relação painel/aba é estrutura JSX independente de viewport (nenhuma renderização condicionada a largura na view), integralmente exercida pela suíte jsdom em todos os ramos; a captura mobile com estado idêntico confirma o check browser-level pós-fix.
- delta (a) ACEITO: `aria-controls` das abas inativas não resolve em nenhum ramo. Padrão pré-existente do HEAD (o ramo calendar sempre renderizou só o painel da aba ativa); ACs 1–3 e o check do audit miram a aba ATIVA; risco do doc alerta contra painéis duplicados em transição; mudar o contrato global de tabs é fora de escopo. Não-regressivo: pós-fix a aba ativa resolve em TODOS os ramos (pré-fix órfava nos ramos fallback).
- delta (b) ACEITO: frame transiente quando `teamId` limpa via efeito `initialIntent` (linhas 523–533 setam `teamId` sem `setCalendar(null)`) com calendar montado, até `loadCalendar` (460–466) anulá-lo no pass de efeito seguinte. Nesse frame pós-fix renderiza o ramo calendar (dado obsoleto da equipe anterior) onde o pré-fix renderizava `OperationalState` nu — exatamente a classe de frame ARIA-órfão que esta task elimina. Relação ARIA permanece íntegra no frame; caminho comum (select de equipe) anula calendar no mesmo batch (linha 838), sem transiente. Cosmético, 1 frame, nenhum critério afetado.
- DoD atendida: matriz completa sem referência ARIA órfã da aba ativa (código + testes + advisory), teclado sem regressão (tablist/`keyboardTabIndex` intocados, testes 1 e 5), evidência task-backed revisada e validada.
- limites desta verificação: PNGs do advisory não inspecionados visualmente (advisory por design, transiente; limitação declarada no próprio registro); nenhuma captura nova executada; validação com leitor de tela real permanece fora (Limitações do task doc). Metadado `status` do task doc não alterado pelo verifier — cabe ao Taskyfier transitar com este veredito.

## Sugestão de commit semântico
- `fix(web): associa vazio de escalas ao tabpanel ativo`
