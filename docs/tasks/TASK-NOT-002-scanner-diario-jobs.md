# TASK-NOT-002 - Scanner diario cria NotificationJobs

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-NOT-002-scanner-diario-jobs.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Criar jobs de notificacao a partir de licencas, status e NotificationRules.

## Inputs
- documento central, secoes 9.1 e 14.2

## Dependencias
- satisfeitas: `TASK-NOT-001`
- em aberto: provider real de envio nao necessario

## Alvos explicitos
1. `modules/notifications/scheduler`
2. dedupe de jobs por regra/periodo/licenca
3. testes de cenarios de vencimento

## Fora de escopo
- chamar Meta diretamente

## Acceptance Criteria
1. Cron/command busca licencas ativas.
2. Consulta rules e cria NotificationJobs.
3. Evita duplicidade para mesma regra/periodo/licenca.
4. Jobs incluem payloadJson suficiente para template.

## Validacao
- testes com licencas regular/a vencer/vencida
- dry-run local

## Riscos
- gerar spam por duplicidade

## Evidencias de entrega
- Criado scanner `scanNotificationJobs`.
- Endpoint ADMIN `POST /v1/notifications/scan`.
- Scanner busca licencas ativas em status `REGULAR`, `EXPIRING` e `EXPIRED`.
- Consulta `NotificationRule` ativa e cria `NotificationJob` com payload de template.
- Dedupe por `licenseId`, `ruleId`, periodo e destinatario.
- UI em `Configuracoes` possui acao `Criar jobs`.

## Validacao realizada
- `npm run check` passou com 73 testes.
- Smoke local: regra 365 dias antes criou job `PENDING` deduplicado.
