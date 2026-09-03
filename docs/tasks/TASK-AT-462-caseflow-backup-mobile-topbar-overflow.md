# TASK-AT-462 - Corrigir overflow da topbar no Backup CaseFlow mobile

## Metadata
- status: ready-to-execute
- pipeline: READY_TO_EXECUTE
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-008` (Grupo B). Vigência reconfirmada em código no HEAD `3088088a`: o caso "CaseFlow backup controls stack at the narrow management viewport" segue em `tests/e2e/visual-responsive-web.mobile.spec.ts` (~linha 141) com gate geométrico vermelho em `main` (HIST-016).
- owner: Runtime Builder Web
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-462-caseflow-backup-mobile-topbar-overflow.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 2-4h
- execution-order: 4

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

## Sugestão de commit semântico
- `fix(web): elimina overflow mobile do backup caseflow`
