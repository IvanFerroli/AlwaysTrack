# TASK-AUD-002 - Consulta administrativa de auditoria

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-AUD-002-consulta-administrativa-auditoria.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Permitir que Admin consulte trilhas de auditoria por periodo, ator, acao e entidade.

## Inputs
- documento central, secao 11

## Dependencias
- satisfeitas: `TASK-AUD-001`, `TASK-AUT-002`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. endpoint de consulta de AuditLog
2. tela administrativa de auditoria
3. filtros por periodo, ator, acao, entidade e organizacao

## Fora de escopo
- SIEM externo
- auditoria juridica formal

## Acceptance Criteria
1. Admin consulta eventos criticos.
2. Usuarios nao autorizados nao acessam logs.
3. Metadata sensivel e exibida com cuidado.
4. Paginacao evita carregar historico inteiro.

## Validacao
- testes de permissao e filtros
- smoke manual com eventos gerados

## Riscos
- auditoria existir no banco mas ser inutil para investigacao

## Evidencia de execucao
- Implementado endpoint `GET /v1/audit-logs` com filtro por periodo, ator, acao, entidade e paginacao.
- Endpoint exige login e role `ADMIN`.
- Implementada tela web simples de consulta de auditoria em `apps/web/src/main.tsx`.
- Smoke real: login admin seguido de consulta retornou evento `auth.login`.
- Validacao executada: `npm run check` e `npm run build --workspace @sylembra/web`.

## Ressalva
- `TASK-AUT-002` e `TASK-UX-002` ainda nao existem como tasks completas; esta task entregou o minimo necessario de role ADMIN e UI propria para consulta.
