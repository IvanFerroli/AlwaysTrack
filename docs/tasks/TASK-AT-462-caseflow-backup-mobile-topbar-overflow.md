# TASK-AT-462 - Corrigir overflow da topbar no Backup CaseFlow mobile

## Metadata
- status: completed-with-risk
- pipeline: DONE — implementação e validação focal concluídas; aceite independente `ACCEPT` em 2026-09-04
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-008` (Grupo B). Vigência reconfirmada em código no HEAD `3088088a`: o caso "CaseFlow backup controls stack at the narrow management viewport" segue em `tests/e2e/visual-responsive-web.mobile.spec.ts` (~linha 141) com gate geométrico vermelho em `main` (HIST-016).
- owner: Runtime Builder Web
- last-updated: 2026-09-04
- source-of-truth: docs/tasks/TASK-AT-462-caseflow-backup-mobile-topbar-overflow.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 2-4h
- execution-order: 4
- execution-record: 2026-09-03 Runtime Builder (lane 5), validado e aceito independentemente em 2026-09-04 — ver registros abaixo

## Objetivo único
Eliminar o overflow residual da topbar em CaseFlow Admin > Backup a 360px sem alterar o contrato funcional de backup/restore.

## Contexto e evidência referenciada
O finding `UX-C05` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` reproduziu corte de controles e falha geométrica em 360x800. `TASK-AT-314` corrigiu um overflow antigo maior; `TASK-AT-455` comprovou que o residual atual de 3px já existia em `main`, registrou-o expressamente como fora de escopo e não o resolveu. Nenhuma task aberta entre `001..457` tem esse aceite focal.

Referência advisory: `INS-C015`. A captura é transitória; o aceite exige nova evidência task-backed.

## Escopo
1. Isolar por geometria se os 3px vêm da topbar compartilhada, account/nav ou toolbar do CaseFlow.
2. Aplicar o menor reflow/containment em `apps/web/src/styles.css` e markup somente se indispensável.
3. Preservar tabs Histórico/Regras/Conectores/Backup e ações de export/restore.
4. Fechar o caso já existente em `tests/e2e/visual-responsive-web.mobile.spec.ts` sem tolerância ou clipping artificial.

## Fora de escopo
- Alterar formato, API, segurança ou comportamento de backup/restore (`TASK-AT-295`).
- Ocultar overflow no documento sem tornar controles alcançáveis.
- Reabrir `TASK-AT-455/456` ou corrigir o residual de primeiro viewport de Usuários/Times.

## Dependências
- satisfeitas: `TASK-AT-295`, `314`, `455`; teste browser e helpers geométricos já existem.
- em aberto: nenhuma.

## Matriz de estados/viewports

| Cenário | Resultado esperado |
|---|---|
| 360x800 / Backup | documento sem overflow; topbar/tabs/ações dentro do viewport |
| 320x700 / shell ADMIN | sem nova regressão de account/nav |
| 390x844 / CaseFlow | reflow estável e controles alcançáveis |
| desktop / CaseFlow | topbar e tabs preservam layout vigente |
| conteúdo largo do Backup | overflow, se necessário, fica contido na região interna correta |

## Critérios de aceite
1. Em 360x800, `documentElement.scrollWidth <= documentElement.clientWidth`.
2. Topbar, conta, atalhos, tabs e ações ficam integralmente dentro do viewport.
3. `expectNoUnexpectedOverflow` e `expectControlsInsideViewport` passam sem margem de tolerância, `overflow-x:hidden` mascarando conteúdo ou skip.
4. Backup/restore continuam operáveis por teclado e desktop não regride.
5. Screenshot task-backed é inspecionado por revisor independente.

## Validação
- Reexecutar e fechar o cenário CaseFlow Backup em `visual-responsive-web.mobile.spec.ts`.
- Acrescentar asserts focais do elemento causador em 360x800 e smoke 320x700/390x844/desktop.
- Web typecheck/build, Playwright focal, testes CaseFlow existentes e `git diff --check`.

## Riscos
- Regra global de topbar pode alterar todas as superfícies autenticadas.
- `overflow-x:hidden` pode fazer o teste passar mantendo controles cortados.
- Ajuste de poucos pixels pode ser sensível a fonte/browser; preferir reflow robusto.

## Limitações
- Evidência atual cobre Chromium, um viewport e sem zoom 200%, landscape ou toque real.
- O residual é conhecido, não regressão causada por `TASK-AT-455`.

## Definição de pronto
- Caso browser antes falho passa por geometria real, evidência task-backed é revisada e shell/CaseFlow desktop permanecem estáveis.

## Registro de execução — 2026-09-03 (Runtime Builder, lane 5)

Causa raiz isolada por geometria (spec descartável de diagnóstico, removida após uso): o overflow de 3px não vinha da toolbar do CaseFlow nem da linha de conta — vinha do chip de grupo "Administração" da topbar compartilhada. `.top-nav` quebra linha por flex-basis (140px); em 360x800 a linha [SAC | Administração] cabe pela base (287px <= 298px de conteúdo) e cada chip cresce para ~145,5px, mas a regra base `.top-nav-domain { min-width: 0 }` deixa o chip encolher abaixo do próprio conteúdo (rótulo nowrap de ~130px + ícone + chevron ≈ 199px intrínseco). Com `justify-content: center` (bloco 560px), o conteúdo transborda dos dois lados: o chevron (`.top-nav-chevron`, `min-width: 15px`) fura a borda direita da `.topbar` (right 345,75px > 344px) e produz `scrollWidth 329 > clientWidth 326`. A janela de disparo é ~350-368px de viewport (390 e 320 quebram linha de forma diferente), o que explica o caso vermelho apenas em 360.

Correção aplicada (reflow real, sem máscara):
- `apps/web/src/styles.css`, bloco `@media (max-width: 560px)`, regra `.top-nav-domain`: acrescentado `min-width: max-content` — o chip quebra para a própria linha em vez de encolher abaixo do conteúdo; sem `overflow-x:hidden`, sem tolerância, sem skip. Desktop (>560px) não é alcançado pela regra.

Camada de teste (`tests/e2e/visual-responsive-web.mobile.spec.ts`):
- Novo helper focal `expectTopNavChipsContained` (assert do elemento causador: cada `.top-nav button` deve conter o próprio conteúdo, `scrollWidth <= clientWidth + 1`).
- Wired em: caso CaseFlow Backup 360x800, SAC/Fluxos 390x844 (2 casos), Administração/Usuários-Times 390x844 e smoke SAC 320x700. Comentário obsoleto sobre "sidebar overlap" removido do caso 360. Nenhum assert enfraquecido.

Validação (Playwright local, projeto `mobile`, servidor E2E isolado):
- Antes: `CaseFlow backup controls stack at the narrow management viewport` vermelho em `main` na etapa `expectNoUnexpectedOverflow` com `.topbar[0]: 329px > 326px` — reproduz HIST-016/ATUX-008.
- Depois: caso verde — todos os gates de geometria passam (`expectNoUnexpectedOverflow`, `expectControlsInsideViewport`, `expectRegionsNotOverlapping`, focais de chip e de `.caseflow-admin`/`.caseflow-backup-layout`); critério 1 (`scrollWidth <= clientWidth` a 360x800) satisfeito; backup/restore seguem operáveis (critério 4).
- Spec mobile completa: 9/10 — única falha é `login remains usable at a 320px narrow viewport`, vermelho pré-existente em `main`, fora de escopo, intocado.
- Spec desktop (`visual-responsive-web.desktop.spec.ts`): 3 falhas pré-existentes verificadas por A/B (`git stash` → mesma lista de casos vermelhos em `main`); nenhuma causada por esta mudança. Observação para o verificador: o caso `collapsed desktop navigation...` (1024x768) é instável em `main` — alterna entre falha de overflow (`.topbar[0]: 741px > 737px`, intermitente, mesma família do defeito do chip "Administração" no limite de ~4px sensível a fonte/rounding) e falha de diff de pixels do baseline obsoleto. Fora do escopo desta task (a matriz exige preservar o layout desktop vigente; estender a regra >560px mudaria layout/baselines desktop). Recomenda-se task própria.
- Suite web vitest: 188/188. Typecheck `tsc --noEmit`: limpo. Build `vite build`: ok (warning de chunk >500kB pré-existente). `git diff --check`: limpo.

Atualização consciente de baseline (conforme `docs/testing/visual-regression.md`):
- Superfície: CaseFlow Admin > Backup; viewport 360x800; arquivo `tests/e2e/visual-responsive-web.mobile.spec.ts-snapshots/web-caseflow-backup-360x800-mobile-linux.png`.
- Razão: (a) o reflow desta task (chip "Administração" ganha linha própria) e (b) baseline obsoleto por mudanças de produto anteriores não capturadas — o PNG antigo mostrava o modelo de navegação pré-agrupamento (chips Notas/Ranking/Campanhas/...) e marca antiga; o caso era vermelho antes de chegar à etapa de screenshot, então o baseline nunca foi readquirido. Procedimento seguido: rodada sem `--update-snapshots` com geometria verde, inspeção de actual/diff, readquirida apenas esta baseline com `--update-snapshots` no projeto correto. Evidência da rodada de inspeção: `test-results/e2e-artifacts/visual-responsive-web.mobi-ae878--narrow-management-viewport-mobile/` (transitória).
- Nenhuma outra baseline foi alterada (`web-sac-flows-390x844.png` permanece verde sem diff — chips SAC têm max-content < 140px e não mudam de hipótese de layout; settings captura apenas `.permission-matrix-panel`; login 320 intocado).

Critérios de aceite: 1, 2, 3 e 4 satisfeitos com evidência de execução; critério 5 (inspeção de screenshot task-backed por revisor independente) fica para o Task Verifier — a captura advisory `UXREQ-AT462-REVALIDATE-20260903-001` não foi executada (execução browser interativa indisponível para este agente); servem como evidência task-backed a execução Playwright focal, o PNG re-adquirido e o trace/vídeo do artefato de teste.

Limitações herdadas: Chromium headless, um viewport por cenário, sem zoom 200%/landscape/toque real; a janela de clique de ~4px do mesmo chip em 1024x768 desktop permanece aberta (fora de escopo).

## Verificação independente final — 2026-09-04

- veredito: `ACCEPT`; revisão realizada por Quality Builder/Task Verifier sem participação na implementação.
- critérios 1–3: atendidos. O caso focal passou `1/1`; a spec mobile terminou `9/10`, com apenas o baseline de login 320px preexistente fora do escopo. A correção usa reflow real com `min-width: max-content`, sem clipping, `overflow-x:hidden`, skip ou enfraquecimento dos gates geométricos.
- critério 4: atendido. A mudança produtiva está restrita ao CSS mobile `@media (max-width: 560px)`; markup, handlers e semântica de teclado de backup/restore permanecem intactos. O teste focal de CaseFlow passou `2/2`, Web typecheck e build passaram; o build manteve somente o warning preexistente de chunk acima de 500 kB.
- critério 5: atendido. O revisor abriu e inspecionou em resolução original o snapshot task-backed `web-caseflow-backup-360x800-mobile-linux.png`; chip "Administração", chevron, conta, atalhos, tabs e ação de atualização aparecem contidos no viewport.
- integridade: `git diff --check` limpo; diff funcional limitado aos quatro arquivos da task; `TASK-AT-458`, `459`, `461` e `464` não foram alteradas.
- limitações aceitas: Chromium headless, sem zoom 200%, landscape, toque/dispositivo real; preservação de teclado confirmada estruturalmente, sem novo E2E focal. A falha visual de login em 320px e a instabilidade desktop em 1024px são preexistentes e permanecem fora do escopo.

## Sugestão de commit semântico
- `fix(web): elimina overflow mobile do backup caseflow`
