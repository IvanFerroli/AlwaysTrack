# TASK-AT-382 - Integracao SAC no dashboard administrativo

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-382-sac-admin-dashboard-integration.md

## Modo
- mode: implementation

## Objetivo unico
Integrar cobertura de pausas, pendencias de Performance e estado de Campanhas SAC ao dashboard administrativo com acoes reais.

## Contexto minimo
O dashboard atual ainda compoe dados de Vendas. A substituicao deve priorizar excecoes e decisoes do dia, sem duplicar os workspaces detalhados.

## Dependencias
- satisfeitas: TASK-AT-372, TASK-AT-375, TASK-AT-380 e TASK-AT-381.
- em aberto: n/a.

## Alvos explicitos
1. Contrato agregado administrativo SAC.
2. Cards/filas de cobertura, swaps, overrides, aprovacoes e campanhas.
3. Navegacao com filtros/contexto preservados.

## Fora de escopo
- Copiar todos os graficos para a home.
- Expor nomes/metricas individuais a role sem escopo.

## Checklist
1. Mostrar proximo breach/overlap, swaps pendentes e overrides recentes.
2. Mostrar batches aguardando revisao e dados ausentes/parciais.
3. Mostrar campanhas ativas, encerrando e sem cobertura suficiente.
4. Fazer cada item abrir a tela correta com filtro aplicado.
5. Limitar queries, estados e dados nominais pelo RBAC.

## Acceptance Criteria
1. Nenhum card ativo depende de `SalesDocument`, ranking ou extrato.
2. Totais reconciliam com os endpoints fonte.
3. ADMIN/GESTOR veem organizacao; SUPERVISOR, quando habilitado, ve apenas time.
4. Estado vazio nao inventa dado de demonstracao.

## Validacao
- comandos/checks: testes de service/dashboard, componente, navegacao e build Web.
- revisao manual: clicar cada card/alerta com duas roles e dois times.

## Riscos
- Endpoint agregado virar query pesada ou contornar scopes dos services fonte.

## Proximo passo provavel
TASK-AT-383

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: dashboard composto sobre services governados, sem query paralela insegura.
