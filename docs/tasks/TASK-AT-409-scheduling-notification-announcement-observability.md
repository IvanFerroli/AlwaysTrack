# TASK-AT-409 - Observabilidade, SLOs e alertas da nova frente

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-409-scheduling-notification-announcement-observability.md

## Modo
- mode: implementation

## Objetivo unico
Estender TASK-AT-383 com telemetria acionavel para materializacao de Escalas, cobertura, negociacoes, deep links e Avisos recorrentes.

## Contexto minimo
Falha de job, escala stale, cobertura atrasada ou notificacao sem alvo pode parecer apenas UI vazia. A operacao precisa distinguir lag, conflito esperado, erro e degradacao.

## Dependencias
- satisfeitas: TASK-AT-383 e TASK-AT-395 a TASK-AT-408.
- em aberto: destino live de metricas/alertas.

## Alvos explicitos
1. Metricas/logs/traces de Escalas, cobertura e scheduler.
2. SLOs de freshness, materializacao, deep-link resolution e occurrence lag.
3. Alertas e runbook de diagnostico.

## Fora de escopo
- PII, userId, entityId ou texto livre como label.
- Declarar alerta live exercitado a partir de mock.

## Checklist
1. Medir materialization lag/failure/conflict e dias sem escala.
2. Medir cobertura stale, reconnect e breaches por causa.
3. Medir oferta/troca stale, rejeicao e tempo de aprovacao.
4. Medir target resolution por estado e uso residual de href legado.
5. Medir occurrence lag, retry, duplicate prevented e catch-up.
6. Correlacionar eventos por request/operation ids opacos.

## Acceptance Criteria
1. Cada invariante critico possui sinal, threshold, owner e acao.
2. Cardinalidade/redaction passam testes.
3. Dashboard diferencia dado atual, stale e indisponivel.
4. Alertas exercitados registram ambiente e limitacao da evidencia.

## Validacao
- comandos/checks: testes metricas/log redaction, smoke de alertas e `npm run repo:hygiene`.
- revisao manual: simular materializador parado, stream stale, alvo removido e scheduler atrasado.

## Riscos
- Label por atendente/regra/ocorrencia explodir cardinalidade.

## Proximo passo provavel
TASK-AT-410

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: observar invariantes de negocio sem identificar pessoas.
