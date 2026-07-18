# TASK-AT-373 - Dicionario e modelo de Performance SAC

## Metadata
- status: correction-in-progress
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-373-sac-performance-metric-dictionary-model.md

## Modo
- mode: implementation

## Objetivo unico
Definir e persistir metricas SAC sem perder unidade, sujeito, canal, granularidade temporal ou proveniencia do dado operacional real.

## Contexto minimo
O exemplo operacional recebido em 2026-07-18 separa CSAT de atendente em escala 0-5, SLA de atendente como duracao e indicadores TikTok de satisfacao, resolucao em 24h e primeira resposta. O modelo inicial tratou CSAT/SLA como percentuais genericos e nao representa essa fonte com fidelidade.

## Dependencias
- satisfeitas: TASK-AT-363 e TASK-AT-364.
- em aberto: formula/unidade final de produtividade e taxonomia de ReclameAqui, ausentes no exemplo recebido; esses itens permanecem separados e nao podem ser inferidos.

## Alvos explicitos
1. Dicionario versionado de metricas, unidades, direcao e agregacao.
2. Schema/migracao de batch, registro, componente e periodo.
3. Validadores de dominio e atribuicao historica de time.

## Fora de escopo
- Integracao automatica com provider de CSAT ou ReclameAqui.
- Score composto ou ranking de atendentes.

## Checklist
1. Guardar CSAT de atendente como `SCORE_1_5` entre 1 e 5; amostra e opcional, mas quando presente pondera a media sem converter a nota em percentual.
2. Guardar SLA/tempo de atendente e primeira resposta de canal como definicoes distintas de duracao normalizada em segundos, exibida em `h/min/s`, com menor valor como melhor. O significado exato do SLA nominal deve permanecer rotulado apenas como SLA ate confirmacao operacional.
3. Guardar satisfacao e resolucao em 24h de canal como `PERCENTAGE`, com numerador/denominador somente quando a fonte os fornecer.
4. Preservar produtividade e ReclameAqui como definicoes independentes; nao reutilizar unidade ou formula de CSAT/SLA.
5. Fixar sujeito (`USER`, `TEAM`, `ORGANIZATION`), canal opcional, timezone, ano de referencia, inicio/fim, granularidade (`REPORTED_INTERVAL` ou `REPORTED_MONTH`) e membership de referencia.
6. Tratar `-`, celula vazia e texto operacional como dado ausente/anotacao, nunca como zero ou valor numerico.
7. Persistir expectativa como alvo versionado separado de realizado; nao somar nem promediar fechamento mensal com os intervalos que o compoem.

## Acceptance Criteria
1. Cada registro carrega definicao/unidade compativel; CSAT 4,4 permanece nota 4,4 e SLA `12min58s` permanece 778 segundos.
2. Periodos sobrepostos/duplicados seguem regra explicita e idempotente.
3. Time do registro nao muda quando o atendente troca de equipe depois.
4. Nenhuma metrica e convertida em percentual, ranking ou score oculto.
5. Indicadores de canal nao se misturam a indicadores nominais de atendente na mesma serie.

## Validacao
- comandos/checks: testes de validadores/agregacao base, migration test e typecheck API/Shared.
- revisao manual: CSAT 1-5, duracoes abaixo/acima de uma hora, percentuais de canal, alvo mensal, `-`, vazio e anotacao textual.

## Riscos
- Chamar contagens diferentes de produtividade e mistura-las no mesmo grafico.

## Proximo passo provavel
TASK-AT-374

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: bloquear implementacao se a unidade de produtividade continuar ambigua.
