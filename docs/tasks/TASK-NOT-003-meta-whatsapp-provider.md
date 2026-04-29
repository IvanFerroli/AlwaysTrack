# TASK-NOT-003 - Meta WhatsApp Provider

## Metadata
- status: proposed
- owner: integrations-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-NOT-003-meta-whatsapp-provider.md

## Modo
- mode: implementation

## Agentes sugeridos
- integrations specialist
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Implementar adaptador direto para Meta WhatsApp Cloud API com contrato substituivel.

## Inputs
- documento central, secoes 3.3 e 9

## Dependencias
- satisfeitas: `TASK-NOT-001`
- em aberto: credenciais Meta reais

## Alvos explicitos
1. `modules/notifications/providers/meta-whatsapp`
2. config/env segura
3. provider fake para testes

## Fora de escopo
- Twilio/Zenvia
- WhatsApp Web

## Acceptance Criteria
1. Provider monta payload de template aprovado.
2. Retorna providerMessageId quando envio e aceito.
3. Erros da Meta sao normalizados.
4. Credenciais nao vazam em logs.

## Validacao
- testes com mock HTTP
- smoke opcional em sandbox Meta

## Riscos
- acoplar dominio a detalhes da Meta
