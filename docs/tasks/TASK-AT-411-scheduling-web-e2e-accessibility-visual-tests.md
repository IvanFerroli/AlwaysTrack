# TASK-AT-411 - Testes Web, E2E, acessibilidade e visual

## Metadata
- status: implemented-partial-browser-evidence-pending
- pipeline: ALREADY_COVERED
- classified-by: olympus-taskyfier run #2 (2026-09-03) — audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-015`: a parcela pendente de evidência browser de agendamento é devidamente de propriedade deste doc; sequenciar a reaquisição DEPOIS de `TASK-AT-461` (o finding UX-C04 provou que a parcela não cobria o branch vazio corrigido por 461); nenhuma task nova derivada
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-411-scheduling-web-e2e-accessibility-visual-tests.md

## Modo
- mode: verification

## Objetivo unico
Estender TASK-AT-385 com jornadas por role/viewport de Escalas, Pausas subordinadas, notificacoes, overlays e Avisos recorrentes.

## Contexto minimo
Calendarios, timelines, popovers e edicao futura podem passar no typecheck e ainda perder foco, ocultar conflito ou abrir entidade errada.

## Dependencias
- satisfeitas: TASK-AT-385, TASK-AT-398 a TASK-AT-408 e TASK-AT-410.
- em aberto: executar o Playwright de navegador e completar SUPERVISOR, workflows de troca/remarcacao, axe e baselines visuais.

## Estado reconciliado em 2026-07-18
- Testes Web de componentes cobrem as superficies principais. Dois specs novos adicionam quatro jornadas: SAC mobile em Escalas/Pausas/Performance/Campanhas, GESTOR no painel explicito de equipe e ciencia SAC visivel nominalmente ao ADMIN. Playwright descobriu 41 testes e o projeto API passou 13/13; os projetos de navegador nao iniciaram por falta de `libnspr4.so`.

## Alvos explicitos
1. Testes de componentes Web.
2. Playwright desktop/mobile por SAC, SUPERVISOR, GESTOR e ADMIN.
3. Axe, teclado, foco, geometry e baselines visuais.

## Fora de escopo
- Autoaccept de screenshot.
- Sleep fixo para sincronizar job/tempo real.

## Checklist
1. Cobrir calendario pessoal e painel gerencial com excecao/dobra.
2. Cobrir oferta/troca/aprovacao e disputa stale.
3. Cobrir Pausa invalida e remarcacao explicita.
4. Cobrir notificacao ativa/removida e Perfil sem preferencia morta.
5. Cobrir outside/Escape/foco em todos os overlays inventariados.
6. Cobrir regra 14/29, edicao futura e ocorrencia historica.

## Acceptance Criteria
1. Jornadas refletem a matriz de role e nao vazam outro time.
2. Calendario/timeline possuem alternativa tabular sem overlap/overflow.
3. Escape/outside restauram foco e nao acionam fundo.
4. E2E espera estado/versao observavel, nao tempo arbitrario.

## Validacao
- comandos/checks: Vitest Web, Playwright desktop/mobile, axe e pixel/geometry checks.
- revisao manual: screenshots/videos e navegacao somente por teclado.

## Riscos
- Seed sem datas relativas nao produzir ocorrencia 14/29 na execucao.

## Proximo passo provavel
TASK-AT-412

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: evidencia visual revisada e cenarios temporais controlados.
