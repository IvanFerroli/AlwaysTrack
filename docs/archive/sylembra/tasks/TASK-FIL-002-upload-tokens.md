# TASK-FIL-002 - Upload tokens seguros

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FIL-002-upload-tokens.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Gerar, validar, expirar e invalidar tokens de upload armazenados como hash.

## Inputs
- documento central, secoes 6.6 e 13.9

## Dependencias
- satisfeitas: `TASK-FIL-001`, `TASK-LIC-001`
- em aberto: n/a

## Alvos explicitos
1. `modules/documents/upload-tokens`
2. rotas de geracao/validacao
3. auditoria de geracao/uso

## Fora de escopo
- envio WhatsApp do link

## Acceptance Criteria
1. Token bruto nunca e salvo.
2. Token expira por `expiresAt`.
3. Token pode ser invalidado apos uso quando configurado.
4. Novo token pode ser gerado para reenvio.

## Validacao
- testes de token valido, expirado, usado e inexistente

## Riscos
- link magico permitir acesso indevido

## Evidencias de entrega
- Criado modulo `services/api/src/core/documents/upload-tokens.*`.
- Token bruto e retornado apenas na geracao; banco armazena somente `tokenHash`.
- Rotas ADMIN: `POST /v1/upload-tokens` e `PATCH /v1/upload-tokens/:uploadTokenId/invalidate`.
- Rota publica de validacao: `GET /v1/public-upload/:token`.
- Token valida inexistente, expirado, usado e inativo.
- Uso de token marca `usedAt`, inativa o token e gera auditoria `upload_token.use`.
- Tela `Licencas` gera link `/upload/:token` para envio.

## Validacao realizada
- `npm run check` passou com 57 testes.
- `npm run setup` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- Smoke local: gerar token, consultar dados publicos, consumir token e confirmar bloqueio de segundo uso.
