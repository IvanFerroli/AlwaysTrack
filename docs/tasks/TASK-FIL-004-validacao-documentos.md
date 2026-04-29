# TASK-FIL-004 - Validacao e recusa de documentos

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FIL-004-validacao-documentos.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar fila de documentos pendentes e acao de aprovar/recusar com motivo.

## Inputs
- documento central, secoes 6.6 e 14.6

## Dependencias
- satisfeitas: `TASK-FIL-003`, `TASK-AUT-002`
- em aberto: notificacao posterior ao profissional

## Alvos explicitos
1. endpoints de approve/reject
2. tela de validacao RT/Admin
3. atualizacao de LicenseStatus

## Fora de escopo
- OCR
- assinatura digital

## Acceptance Criteria
1. RT/Admin aprova documento e registra validatedBy/validatedAt.
2. Recusa exige motivo.
3. Documento aprovado/recusado nao perde historico.
4. Auditoria registra status anterior/novo.

## Validacao
- testes de aprovacao/recusa
- smoke manual da fila

## Riscos
- aprovar documento fora do escopo do usuario

## Evidencias de entrega
- Criada fila `GET /v1/documents` com filtro por status, profissional e licenca.
- Criado endpoint `PATCH /v1/documents/:documentId/validation` para aprovar/recusar.
- Aprovacao/recusa exige `ADMIN` ou `RT` dentro do escopo do documento.
- Recusa exige `rejectionReason`.
- Documento guarda `validatedById`, `validatedAt`, `rejectionReason` e mantem historico.
- Auditoria registra `previousStatus`, status novo, licenca e profissional.
- Validacao recalcula `LicenseStatus` da licenca vinculada.
- Tela `Documentos` virou fila operacional com baixar, aprovar e recusar.

## Validacao realizada
- `npm run check` passou com 62 testes.
- `npm run setup` passou.
- `npm run build --workspace @sylembra/web` passou.
- Smoke local: gerar token, upload publico PDF, consultar fila, aprovar documento, conferir licenca `REGULAR` e auditoria `document.approve`.
