# TASK-NOT-005 - Webhook da Meta e status de entrega

## Metadata
- status: completed
- owner: integrations-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-NOT-005-webhook-meta-status.md

## Modo
- mode: implementation

## Agentes sugeridos
- integrations specialist
- security reviewer
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Receber eventos da Meta, validar webhook e atualizar NotificationJob/NotificationLog.

## Inputs
- documento central, secoes 9.1 e 14.4

## Dependencias
- satisfeitas: `TASK-NOT-004`
- em aberto: configuracao real do webhook Meta

## Alvos explicitos
1. endpoint webhook
2. validacao de assinatura/token
3. mapeamento SENT/DELIVERED/READ/FAILED

## Fora de escopo
- inbox de atendimento

## Acceptance Criteria
1. Evento localiza job por providerMessageId.
2. Status atualiza datas correspondentes.
3. Payload bruto fica em log controlado.
4. Evento invalido e rejeitado sem alterar estado.

## Validacao
- testes com fixtures de webhook
- smoke local com payload assinado/mockado

## Riscos
- aceitar webhook falso

## Evidencias de entrega
- Criado endpoint `GET /v1/webhooks/meta-whatsapp` para verificacao de webhook.
- Criado endpoint `POST /v1/webhooks/meta-whatsapp` para eventos de status.
- Suporte a assinatura `x-hub-signature-256` quando `META_APP_SECRET` estiver configurado.
- Evento localiza job por `providerMessageId`.
- Status mapeia `SENT`, `DELIVERED`, `READ`, `FAILED` e atualiza datas correspondentes.
- Payload bruto controlado fica em `NotificationLog`.

## Validacao realizada
- `npm run check` passou com 73 testes.
- Smoke local: webhook mockado atualizou job fake para `DELIVERED`.
