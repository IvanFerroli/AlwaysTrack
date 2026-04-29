# TASK-AUT-002 - Roles e escopo de acesso

## Metadata
- status: completed
- owner: contracts-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-AUT-002-roles-escopo-acesso.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- security reviewer
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Aplicar autorizacao para ADMIN, RT e SUPERVISOR com escopo por organizacao/unidade/setor.

## Inputs
- documento central, secoes 6.1 e 6.2

## Dependencias
- satisfeitas: `TASK-AUT-001`
- em aberto: n/a

## Alvos explicitos
1. middleware/policy de autorizacao
2. helpers de escopo de consulta
3. testes por role

## Fora de escopo
- multi-tenant SaaS completo

## Acceptance Criteria
1. ADMIN acessa dados da organizacao.
2. RT acessa profissionais sob responsabilidade.
3. SUPERVISOR acessa setores/unidades associados.
4. Tentativas fora do escopo retornam erro controlado.

## Validacao
- testes de policy
- `npm run check`

## Riscos
- vazar dados entre setores/unidades
- permissao duplicada em controllers

## Evidencia de execucao
- Criado policy helper puro em `services/api/src/core/auth/access-policy.ts`.
- `CurrentUser` passou a carregar `unitScopeIds` e `sectorScopeIds`.
- `requireAuth` hidrata escopos a partir de `User.unitScopeJson` e `User.sectorScopeJson`.
- Testes cobrem ADMIN, bloqueio cross-org, RT por `responsibleRtId`, SUPERVISOR por unidade/setor e helper de filtro por organizacao.
- Migration incremental criada em `services/api/prisma/migrations/20260429123500_user_scope_columns/migration.sql`.
- `scripts/start-all.js` agora cria banco novo a partir do schema atual via `prisma migrate diff`.
- Validacao executada: `npm run check`, `npm run setup`.

## Ressalva
- Como os modulos de profissionais, unidades e setores ainda nao existem, a policy foi entregue como contrato reutilizavel e testado, sem aplicar filtros em CRUDs futuros.
