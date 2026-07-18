# TASK-AT-385 - Testes Web, E2E, acessibilidade e visual SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-385-sac-web-e2e-accessibility-visual-tests.md

## Modo
- mode: verification

## Objetivo unico
Proteger jornadas completas de Pausas, Performance, Campanhas e aposentadoria de Vendas em roles e viewports criticos.

## Contexto minimo
Graficos, tabelas, dialogs e navegacao por role podem passar no typecheck e ainda esconder acoes, sobrepor texto ou depender de mouse/cor.

## Dependencias
- satisfeitas: TASK-AT-381, TASK-AT-382 e TASK-AT-384.
- em aberto: n/a.

## Alvos explicitos
1. Testes de componente Web.
2. Playwright por jornada/role desktop e mobile.
3. Axe, teclado, foco, contraste e baselines visuais.

## Fora de escopo
- Atualizar baseline sem revisar diferenca.
- Usar sleep fixo para esconder race.

## Checklist
1. Cobrir escolher/cancelar/trocar pausa e conflito da ultima vaga.
2. Cobrir lancar/submeter/revisar/corrigir Performance.
3. Cobrir campanha do draft ao resultado.
4. Cobrir overlap/graficos com tabela, teclado e leitor de tela.
5. Provar ausencia de menus, deep links e nomenclatura de Vendas.

## Acceptance Criteria
1. Jornadas passam para SAC, SUPERVISOR, GESTOR e ADMIN conforme matriz.
2. Mobile nao possui overflow, overlap ou texto cortado nas telas criticas.
3. Graficos possuem nome acessivel e alternativa equivalente.
4. URL legada nao monta componente operacional removido.

## Validacao
- comandos/checks: testes Web, Playwright desktop/mobile, axe e pixel/geometry checks.
- revisao manual: revisar screenshots e videos de falha, sem autoaccept.

## Riscos
- Seed fraco tornar E2E verde sem exercitar conflito, breach e revisao.

## Proximo passo provavel
TASK-AT-386

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: evidencias visuais revisadas, nao apenas geradas.
