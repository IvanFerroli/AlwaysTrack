# TASK-NOT-001 - Templates e regras de notificacao

## Metadata
- status: proposed
- owner: contracts-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-NOT-001-templates-regras.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar NotificationTemplate e NotificationRule como configuracao, sem hardcode de mensagens.

## Inputs
- documento central, secoes 9.4, 9.5 e 21.2

## Dependencias
- satisfeitas: `TASK-LIC-002`, `TASK-UX-002`
- em aberto: templates aprovados na Meta podem ser mockados

## Alvos explicitos
1. modulo `modules/notifications/templates`
2. modulo `modules/notifications/rules`
3. telas simples de configuracao

## Fora de escopo
- envio real via Meta

## Acceptance Criteria
1. Templates possuem key, channel, metaTemplateName, language e preview.
2. Rules configuram dias antes, repeticao pos-vencimento, canal e destinatarios.
3. Alteracoes geram auditoria.

## Validacao
- testes de CRUD/config
- smoke manual

## Riscos
- templates ficarem acoplados a texto fixo no codigo
