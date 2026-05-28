# TASK-LIC-002 - Motor de status e vencimento

## Metadata
- status: completed
- owner: contracts-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-LIC-002-motor-status-vencimento.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- runtime builder
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Implementar calculo de LicenseStatus sem misturar status de Document.

## Inputs
- documento central, secoes 6.7 e 21.3

## Dependencias
- satisfeitas: `TASK-LIC-001`
- em aberto: rules de notificacao ainda podem estar ausentes

## Alvos explicitos
1. `modules/licenses/status`
2. testes de regras
3. job/endpoint interno de recalculo

## Fora de escopo
- envio de notificacoes

## Acceptance Criteria
1. Calcula REGULAR, EXPIRING, EXPIRED, PENDING_DOCUMENT, PENDING_VALIDATION e INACTIVE.
2. Prazos sao configuraveis por regra/tipo, nao hardcoded em controller.
3. Recalculo registra mudancas relevantes.

## Validacao
- matriz de testes para datas e documentos
- `npm run check`

## Riscos
- regra de status ficar espalhada

## Evidencias de entrega
- Criado motor central em `services/api/src/core/licenses/status.ts`.
- Regra cobre `REGULAR`, `EXPIRING`, `EXPIRED`, `PENDING_DOCUMENT`, `PENDING_VALIDATION` e `INACTIVE`.
- Janela de vencimento usa `LicenseType.defaultWarningDays` e `NotificationRule.daysBeforeExpiration` ativa; controller nao contem regra de prazo.
- Criado endpoint ADMIN `POST /v1/licenses/recalculate` para recalcular todas as licencas da organizacao ou uma licenca especifica.
- Recalculo registra auditoria `license.status_recalculate` quando houver mudanca.
- Tela `Licencas` ganhou acao operacional de recalculo.

## Validacao realizada
- `npm run check` passou com 44 testes.
- `npm run setup` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- Smoke local: health, login admin, `POST /v1/licenses/recalculate`, listagem de licencas e auditoria de recalc.
