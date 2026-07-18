# TASK-AT-401 - Painel gerencial de Escalas SAC

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-401-sac-manager-scheduling-panel.md

## Modo
- mode: implementation

## Objetivo unico
Criar painel gerencial denso para publicar regras, acompanhar escala efetiva, resolver conflitos e decidir excecoes/trocas.

## Contexto minimo
Gestao precisa comparar cobertura por time/data e agir sem editar entidades por caminhos dispersos. O painel nao deve duplicar o calendario pessoal nem esconder regras.

## Dependencias
- satisfeitas: TASK-AT-394, TASK-AT-396, TASK-AT-399 e TASK-AT-400.
- em aberto: n/a.

## Alvos explicitos
1. View gerencial por time, data, atendente, estado e tipo.
2. Filas de conflito, excecao, oferta/troca e falta de materializacao.
3. Acoes com preview de impacto e deep link preservado.

## Fora de escopo
- Dashboard decorativo ou BI de produtividade.
- Edicao livre sem versionamento.

## Checklist
1. Exibir turnos efetivos, gaps, extras, ausencias e pendencias.
2. Mostrar versao da regra e provenance do dia selecionado.
3. Integrar preview de capacidade antes de aprovar/alterar.
4. Permitir filtros e exportacao segura sem quebrar tenancy.
5. Abrir entidade exata a partir de notificacao/dashboard.

## Acceptance Criteria
1. Cada conflito/pendencia possui owner, motivo e acao real.
2. SUPERVISOR ve apenas time/periodo autorizado; GESTOR/ADMIN respeitam tenant.
3. Totais reconciliam com escala efetiva e workflows fonte.
4. Nenhuma acao altera passado ou Pausa silenciosamente.

## Validacao
- comandos/checks: testes agregacao/RBAC/componentes, acessibilidade, build e screenshots desktop/mobile.
- revisao manual: operar dois times com regra, falta, dobra e troca pendente.

## Riscos
- Query agregada contornar scopes ou ficar cara em janela extensa.

## Proximo passo provavel
TASK-AT-402

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: painel composto sobre services canonicos e paginados.
