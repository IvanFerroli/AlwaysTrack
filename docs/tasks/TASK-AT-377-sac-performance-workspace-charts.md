# TASK-AT-377 - Workspace e graficos de Performance SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-377-sac-performance-workspace-charts.md

## Modo
- mode: implementation

## Objetivo unico
Criar a superficie operacional de Performance SAC para lancamento governado, revisao e leitura por filtros autorizados.

## Contexto minimo
A tela deve servir a trabalho repetido: filtros densos, estado de governanca e graficos legiveis, sem transformar metricas em placar.

## Dependencias
- satisfeitas: TASK-AT-374, TASK-AT-375 e TASK-AT-376.
- em aberto: n/a.

## Alvos explicitos
1. View Performance SAC e navegacao SAC.
2. Tabs Resumo, Lancamentos, Revisao e Historico conforme permissao.
3. Graficos reutilizaveis de serie, meta/referencia e composicao.

## Fora de escopo
- Landing page ou cards decorativos.
- Ranking, medalhas, podium ou comparacao nominal publica.

## Checklist
1. Filtrar atendente/time/periodo/metrica com URL/estado previsivel.
2. Exibir CSAT, produtividade, SLA e ReclameAqui com unidade e cobertura.
3. Diferenciar draft, pendente, aprovado, rejeitado e superseded.
4. Oferecer tabela acessivel equivalente aos graficos.
5. Cobrir loading, vazio, erro, dado parcial e viewport mobile.

## Acceptance Criteria
1. Cada numero mostra unidade, periodo, status e formula/denominador aplicavel.
2. Acoes aparecem apenas para permissoes autorizadas e API continua como enforcement.
3. Alterar filtro atualiza cards, grafico, tabela e exportacao de modo consistente.
4. Nenhum componente ordena atendentes por desempenho por padrao.

## Validacao
- comandos/checks: testes de componente, acessibilidade, typecheck/build Web e screenshots desktop/mobile.
- revisao manual: jornadas SAC, SUPERVISOR, GESTOR e ADMIN.

## Riscos
- Reuso visual do ranking carregar semantica competitiva indevida.

## Proximo passo provavel
TASK-AT-378

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: interface operacional densa e orientada a governanca.
