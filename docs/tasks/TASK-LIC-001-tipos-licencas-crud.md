# TASK-LIC-001 - Tipos de licenca e licencas

## Metadata
- status: proposed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-LIC-001-tipos-licencas-crud.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- contracts builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar LicenseType e License com multiplas licencas por profissional.

## Inputs
- documento central, secao 6.5

## Dependencias
- satisfeitas: `TASK-PRO-001`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. modulo `modules/licenses`
2. rotas de tipos/licencas
3. telas de cadastro e detalhe

## Fora de escopo
- upload de arquivo
- notificacoes

## Acceptance Criteria
1. Licenca referencia Professional e LicenseType.
2. Licenca aceita numero, emissor/UF, datas, observacoes e status.
3. Professional pode ter varias licencas.
4. Alteracoes relevantes geram auditoria.

## Validacao
- testes de CRUD e relacoes
- smoke manual no detalhe do profissional

## Riscos
- prender entidade apenas a COREN e bloquear documentos futuros
