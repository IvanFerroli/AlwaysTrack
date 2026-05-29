# TASK-NOT-004 - Worker de envio e retentativas

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-NOT-004-worker-envio-retentativas.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- integrations specialist
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Processar NotificationJobs pendentes com status, tentativas e logs persistidos.

## Inputs
- documento central, secoes 9.1, 9.3, 9.7 e 14.3

## Dependencias
- satisfeitas: `TASK-NOT-002`, `TASK-NOT-003`
- em aberto: n/a

## Alvos explicitos
1. worker/command de envio
2. controle PENDING/PROCESSING/SENT/FAILED
3. NotificationLog

## Fora de escopo
- Redis/BullMQ

## Acceptance Criteria
1. Worker pega jobs elegiveis e marca PROCESSING.
2. Sucesso salva SENT e providerMessageId.
3. Falha salva FAILED, attempts, errorMessage e nextRetryAt.
4. NotificationLog guarda rawPayload/rawResponse de forma controlada.

## Validacao
- testes de sucesso/falha/retry
- dry-run com provider fake

## Riscos
- concorrencia enviar job duplicado

## Evidencias de entrega
- Criado worker `processNotificationJobs`.
- Endpoint ADMIN `POST /v1/notifications/process`.
- Worker pega jobs `PENDING`/`FAILED` elegiveis e marca `PROCESSING`.
- Sucesso marca `SENT`, salva provider/providerMessageId e `NotificationLog`.
- Falha marca `FAILED`, incrementa attempts, salva errorMessage e nextRetryAt quando aplicavel.
- UI em `Configuracoes` possui acao `Processar jobs`.

## Validacao realizada
- `npm run check` passou com 73 testes.
- Smoke local: worker processou job com provider fake e salvou status `SENT`.
