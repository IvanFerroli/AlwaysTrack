# TASK-AT-383 - Observabilidade, SLOs e alertas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-383-sac-observability-slos-alerts.md

## Modo
- mode: implementation

## Objetivo unico
Instrumentar Pausas, Performance, Campanhas e ponte legada com sinais acionaveis, correlacionados e sem PII em labels.

## Contexto minimo
Concorrencia, overrides, batches manuais e sunset exigem telemetria propria. Logs genericos de HTTP nao explicam perda de capacidade ou atraso de aprovacao.

## Dependencias
- satisfeitas: TASK-AT-366, TASK-AT-371, TASK-AT-375, TASK-AT-380 e TASK-AT-382.
- em aberto: ambiente de alertas live continua dependente de deploy autorizado.

## Alvos explicitos
1. Metricas, logs estruturados e tracing/requestId dos dominios SAC.
2. SLOs e alertas para disponibilidade, latencia e invariantes de negocio.
3. Painel operacional e runbook de diagnostico.

## Fora de escopo
- Usar email, nome, userId ou texto livre como label de metrica.
- Declarar alertas live exercitados a partir de mock.

## Checklist
1. Medir conflito de capacidade, booking, swap, override e breach.
2. Medir drafts/submissions stale, rejeicoes de importacao e tempo ate aprovacao.
3. Medir campanhas sem dados e uso residual de rotas legadas.
4. Correlacionar auditoria/log/traces por ids opacos e tenant seguro.
5. Exercitar alertas local/production-like e documentar limites.

## Acceptance Criteria
1. Cada incidente critico possui sinal, threshold, owner e acao.
2. Cardinalidade e redaction passam testes.
3. Uso de rota legada pode orientar sunset sem identificar consumidor no label.
4. Breach de capacidade por override e distinguivel de falha de concorrencia.

## Validacao
- comandos/checks: testes de metricas/log redaction, smoke de alerta e `npm run repo:hygiene`.
- revisao manual: simular conflito, override, lote rejeitado e chamada legada.

## Riscos
- Cardinalidade por slot/usuario tornar observabilidade cara e insegura.

## Proximo passo provavel
TASK-AT-384

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: classificar evidencia de alerta como local, production-like ou live.
