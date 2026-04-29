# TASK-LIC-002 - Motor de status e vencimento

## Metadata
- status: proposed
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
