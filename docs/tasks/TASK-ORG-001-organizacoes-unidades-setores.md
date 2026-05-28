# TASK-ORG-001 - Organizacoes, unidades e setores

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-ORG-001-organizacoes-unidades-setores.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar CRUD operacional de Organization, Unit e Sector com soft deactivation.

## Inputs
- documento central, secao 6.3

## Dependencias
- satisfeitas: `TASK-AUT-002`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. modulo `core/organizations`
2. rotas API
3. telas administrativas basicas

## Fora de escopo
- billing multi-cliente

## Acceptance Criteria
1. Admin cria/edita/desativa organizacao, unidade e setor.
2. Setor pertence a unidade; unidade pertence a organizacao.
3. Exclusao destrutiva nao remove historico.
4. Mudancas relevantes geram auditoria.

## Validacao
- testes de service
- smoke manual no admin

## Riscos
- permitir apagar entidades com historico

## Execucao
- Criado modulo `core/organizations` com service, handlers e testes.
- Adicionadas rotas admin para consultar/atualizar organizacao atual, criar/editar/desativar unidades e criar/editar/desativar setores.
- Soft deactivation implementado via campo `active`; nenhuma rota faz delete destrutivo.
- Rotas protegidas por `requireAuth` e `requireRole(["ADMIN"])`.
- Mudancas relevantes registram auditoria.
- Tela de Configuracoes implementada no app shell para operar organizacao, unidades e setores.

## Evidencias
- `npm run check`
- `npm run setup`
- `npm run build --workspace @alwaystrack/web`
- Smoke local:
  - `GET /health`
  - `POST /v1/auth/login`
  - `GET /v1/organization`
  - `POST /v1/organization/units`
  - `GET /v1/audit-logs?action=unit.create`
