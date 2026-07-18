# TASK-AT-376 - Agregacoes de Performance SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-376-sac-performance-aggregations-api.md

## Modo
- mode: implementation

## Objetivo unico
Expor series e consolidados reconciliaveis por atendente, time e periodo usando somente versoes aprovadas.

## Contexto minimo
CSAT/SLA exigem soma de numeradores e denominadores; produtividade e ocorrencias possuem outras funcoes de agregacao. Filtros nao podem alterar escopo autorizado.

## Dependencias
- satisfeitas: TASK-AT-375.
- em aberto: n/a.

## Alvos explicitos
1. Servico de agregacao e endpoint de summary/series/detail.
2. Paginacao, filtros e exportacao segura.
3. Explicacao de formula, cobertura e dados ausentes.

## Fora de escopo
- Benchmark externo.
- Ranking ou ordenacao competitiva nominal.

## Checklist
1. Somar componentes antes de derivar CSAT/SLA.
2. Aplicar formula versionada de produtividade e soma de ocorrencias.
3. Resolver membership pela competencia do registro.
4. Distinguir zero, sem dado, pendente e rejeitado.
5. Aplicar limites de periodo, paginacao, indices e rate limit.

## Acceptance Criteria
1. Totais de time reconciliam com o detalhe aprovado do periodo.
2. Media de percentuais nao ponderada nao e usada.
3. SAC ve apenas escopo proprio; supervisao respeita time e competencia.
4. CSV neutraliza formulas e registra exportacao auditavel.

## Validacao
- comandos/checks: golden cases matematicos, anti-IDOR, query plan production-like e contract tests.
- revisao manual: reconciliar API, exportacao e registros aprovados de duas equipes.

## Riscos
- Membership atual contaminar periodo historico.

## Proximo passo provavel
TASK-AT-377

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: formulas publicas e cobertas por golden cases.
