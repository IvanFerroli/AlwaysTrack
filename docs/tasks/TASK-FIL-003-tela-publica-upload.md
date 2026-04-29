# TASK-FIL-003 - Tela publica de upload

## Metadata
- status: proposed
- owner: frontend implementer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FIL-003-tela-publica-upload.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- runtime builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Permitir que a profissional envie documento por link magico sem login.

## Inputs
- documento central, secao 6.6

## Dependencias
- satisfeitas: `TASK-FIL-002`
- em aberto: n/a

## Alvos explicitos
1. rota publica web de upload
2. endpoint de upload por token
3. criacao de Document com status UPLOADED

## Fora de escopo
- portal completo da profissional

## Acceptance Criteria
1. Tela mostra pendencia especifica e dados minimos.
2. Aceita PDF/imagem dentro do limite.
3. Cria Document vinculado a Professional, License e UploadToken.
4. Licenca pode ir para PENDING_VALIDATION.
5. Uso gera auditoria.

## Validacao
- teste manual com token valido/expirado
- testes de validacao de arquivo

## Riscos
- expor dados sensiveis demais na tela publica
