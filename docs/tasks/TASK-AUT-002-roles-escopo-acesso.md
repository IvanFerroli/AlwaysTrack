# TASK-AUT-002 - Roles e escopo de acesso

## Metadata
- status: proposed
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
