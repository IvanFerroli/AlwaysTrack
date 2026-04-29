# TASK-AUD-001 - Audit log transversal

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-AUD-001-audit-log-transversal.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_orchestrator`
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Implementar servico de auditoria reutilizavel antes dos CRUDs de dominio.

## Inputs
- documento central, secao 11

## Dependencias
- satisfeitas: `TASK-DAT-001`
- em aberto: n/a

## Alvos explicitos
1. modulo `core/audit`
2. API interna `recordAuditLog`
3. testes de persistencia

## Fora de escopo
- tela completa de auditoria

## Acceptance Criteria
1. Auditoria registra actor, action, entityType, entityId e metadata.
2. Acoes via token aceitam actor nulo com contexto.
3. Servico e facil de chamar por outros modulos.

## Validacao
- teste unitario/integracao do audit service
- `npm run check`

## Riscos
- auditoria virar opcional e ser esquecida nos proximos modulos

## Evidencia de execucao
- Implementado `recordAuditLog` em `services/api/src/core/audit/audit.service.ts`.
- `auth.login` e `auth.logout` registram auditoria.
- Acoes sem ator sao aceitas pelo contrato do servico (`actorId: null`).
- Testes: `services/api/src/core/audit/audit.service.test.ts`.
- Validacao executada: `npm run check`.
