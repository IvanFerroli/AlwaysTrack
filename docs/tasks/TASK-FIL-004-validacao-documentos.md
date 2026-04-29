# TASK-FIL-004 - Validacao e recusa de documentos

## Metadata
- status: proposed
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
