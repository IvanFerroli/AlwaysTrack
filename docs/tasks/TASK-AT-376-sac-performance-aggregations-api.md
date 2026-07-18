# TASK-AT-376 - Agregacoes de Performance SAC

## Metadata
- status: correction-planned
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-376-sac-performance-aggregations-api.md

## Modo
- mode: implementation

## Objetivo unico
Expor series e consolidados reconciliaveis por atendente, time e periodo usando somente versoes aprovadas.

## Contexto minimo
Cada definicao exige agregacao propria: score 0-5 pode usar media ponderada por amostra, duracao usa media ponderada em segundos, percentual usa componentes quando disponiveis e contagem usa soma. Filtros nao podem alterar escopo autorizado nem misturar canal e atendente.

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
1. Aplicar agregador do dicionario: `WEIGHTED_MEAN`, `MEAN`, `RATIO` ou `SUM`, sem condicional generica por nome antigo.
2. Calcular scores e duracoes na unidade canonica; percentuais com componentes usam razao das somas.
3. Resolver membership pela competencia do registro.
4. Distinguir zero, sem dado, pendente e rejeitado.
5. Aplicar limites de periodo, paginacao, indices e rate limit.

## Acceptance Criteria
1. Totais de time reconciliam com o detalhe aprovado do periodo.
2. CSAT 0-5, duracao e percentual nunca compartilham formatador ou formula por coincidencia de chave.
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
