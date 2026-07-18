# TASK-AT-407 - Materializador idempotente de Avisos recorrentes

## Metadata
- status: implemented-local-evidence-pending-external
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-407-announcement-occurrence-idempotent-scheduler.md

## Modo
- mode: implementation

## Objetivo unico
Materializar, publicar, expirar e notificar ocorrencias recorrentes exatamente uma vez sob retry e execucao concorrente.

## Contexto minimo
O `effectiveStatus` atual calcula vigencia em leitura, mas nao publica/notifica automaticamente no horario agendado. Scheduler precisa de claim, chave unica e reconciliacao.

## Dependencias
- satisfeitas: TASK-AT-397 e TASK-AT-406.
- em aberto: executar scheduler concorrente/catch-up no ambiente alvo e provar retomada sem duplicidade; cron de referencia e job local estao versionados.

## Estado reconciliado em 2026-07-18
- Materializacao, publicacao e expiracao usam chaves unicas, claim e compare-and-set. Retry local foi exercitado, mas exactly-once logico sob concorrencia PostgreSQL e falha parcial continua gate externo.

## Alvos explicitos
1. Job/servico dry-run e materializacao por horizonte.
2. Claim/lease, dedupe e reconciliacao de ocorrencias.
3. Publicacao, notificacao tipada, expiracao e auditoria.

## Fora de escopo
- Enviar canal externo.
- Depender de cron exato sem catch-up.

## Checklist
1. Calcular due occurrences pela versao/timezone vigente.
2. Inserir por unique key e publicar/notificar por transacao/outbox equivalente.
3. Fazer catch-up limitado apos downtime sem tempestade de notificacao.
4. Expirar ocorrencia pela propria vigencia e manter historico.
5. Reconciliar estado `created/published/notified/expired/failed` com retry.
6. Registrar lag, tentativa e erro redigido.

## Acceptance Criteria
1. Duas instancias concorrentes criam uma ocorrencia e uma notificacao por destinatario.
2. Retry apos falha parcial converge sem duplicar receipt/audiencia.
3. Ocorrencia perdida por downtime e recuperada conforme politica de catch-up.
4. Dias 14/29 e virada de timezone possuem golden cases.

## Validacao
- comandos/checks: fake clock, concorrencia Postgres, job retry/catch-up, notification dedupe e integration tests.
- revisao manual: simular queda antes/depois de publicar/notificar.

## Riscos
- Publicar no banco e falhar antes de notificar sem reconciliador.

## Proximo passo provavel
TASK-AT-408

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: exactly-once logico por idempotencia, nao por suposicao do cron.
