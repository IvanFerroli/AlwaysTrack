# TASK-AT-372 - Grafico de overlap e cobertura de pausas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-372-sac-pause-overlap-coverage-chart.md

## Modo
- mode: implementation

## Objetivo unico
Exibir sobreposicao de pausas e capacidade restante por time, data e intervalo com alternativa tabular acessivel.

## Contexto minimo
O grafico precisa apoiar decisao operacional e revelar breaches/overrides, nao apenas desenhar barras de agenda.

## Dependencias
- satisfeitas: TASK-AT-369 e TASK-AT-371.
- em aberto: n/a.

## Alvos explicitos
1. Endpoint agregado de timeline de cobertura.
2. Grafico responsivo de overlap, piso e capacidade restante.
3. Tabela equivalente, filtros e estados vazio/erro/loading.

## Fora de escopo
- Edicao por drag-and-drop.
- Previsao por IA.

## Checklist
1. Agregar slots confirmados, swaps efetivados, cancelamentos e overrides.
2. Mostrar escala total, pausas simultaneas, disponiveis e piso.
3. Destacar intervalo abaixo do minimo e origem do override sem expor PII indevida.
4. Sincronizar tooltip, legenda e tabela com filtros/timezone.
5. Garantir teclado, foco, contraste e leitura em mobile.

## Acceptance Criteria
1. Cada ponto do grafico reconcilia com a API e reservas do intervalo.
2. Overlap no limite e breach possuem estados visuais/semanticos distintos.
3. A tabela permite obter a mesma informacao sem depender de cor ou hover.
4. Filtro por time respeita RBAC e membership historico.

## Validacao
- comandos/checks: testes de agregacao, componentes, acessibilidade e screenshots desktop/mobile.
- revisao manual: comparar timeline com agenda seedada e um override.

## Riscos
- Bucket visual esconder uma violacao curta entre dois pontos.

## Proximo passo provavel
TASK-AT-373

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: granularidade visual nunca pode suavizar breach real.
