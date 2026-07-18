# TASK-AT-373 - Dicionario e modelo de Performance SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-373-sac-performance-metric-dictionary-model.md

## Modo
- mode: implementation

## Objetivo unico
Definir e persistir componentes agregaveis de CSAT, produtividade, SLA e ocorrencias ReclameAqui por atendente e periodo.

## Contexto minimo
Entrada manual sem unidade, denominador, fonte e regra temporal produz graficos matematicamente incorretos. Lotacao historica deve fixar o time aplicavel.

## Dependencias
- satisfeitas: TASK-AT-363 e TASK-AT-364.
- em aberto: aprovacao de produto para definicao final de produtividade e janela de SLA.

## Alvos explicitos
1. Dicionario versionado de metricas e unidades.
2. Schema/migracao de batch, registro, componente e periodo.
3. Validadores de dominio e atribuicao historica de time.

## Fora de escopo
- Integracao automatica com provider de CSAT ou ReclameAqui.
- Score composto ou ranking de atendentes.

## Checklist
1. Guardar CSAT e SLA por numerador/denominador, derivando percentual.
2. Guardar produtividade por componentes definidos, sem unidade ambigua.
3. Guardar ocorrencias ReclameAqui como inteiro nao negativo e categorias governadas.
4. Fixar timezone, inicio/fim, granularidade e membership de referencia.
5. Definir arredondamento, dado ausente, zero elegivel e limites.

## Acceptance Criteria
1. Percentual sem denominador valido e rejeitado ou marcado nao agregavel.
2. Periodos sobrepostos/duplicados seguem regra explicita e idempotente.
3. Time do registro nao muda quando o atendente troca de equipe depois.
4. Nenhuma metrica e convertida em ranking ou score oculto.

## Validacao
- comandos/checks: testes de validadores/agregacao base, migration test e typecheck API/Shared.
- revisao manual: exemplos de CSAT, SLA, produtividade e ReclameAqui com zero/ausente.

## Riscos
- Chamar contagens diferentes de produtividade e mistura-las no mesmo grafico.

## Proximo passo provavel
TASK-AT-374

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: bloquear implementacao se a unidade de produtividade continuar ambigua.
