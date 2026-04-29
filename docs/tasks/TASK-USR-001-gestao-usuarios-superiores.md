# TASK-USR-001 - Gestao de usuarios superiores

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-USR-001-gestao-usuarios-superiores.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Permitir criar, editar, ativar/desativar, definir role e resetar senha de usuarios administrativos.

## Inputs
- documento central, secao 6.2

## Dependencias
- satisfeitas: `TASK-ORG-001`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. modulo `core/users`
2. rotas protegidas de usuarios
3. tela de usuarios

## Fora de escopo
- self-service de cadastro
- portal de profissional

## Acceptance Criteria
1. Admin gerencia usuarios.
2. RT/SUPERVISOR recebem associacoes de escopo.
3. Usuario com historico pode ser desativado, nao apagado.
4. Reset de senha nao expõe senha antiga.

## Validacao
- testes de permissionamento
- teste manual de reset/desativacao

## Riscos
- escalacao indevida de role

## Resultado
- Criado modulo `services/api/src/core/users` com listagem, criacao, edicao, ativacao/desativacao e reset de senha.
- Rotas `/v1/users` protegidas por `ADMIN` e escopadas ao `organizationId` do usuario autenticado.
- Roles `ADMIN`, `RT` e `SUPERVISOR` validadas contra o contrato compartilhado.
- Escopos `unitScopeIds` e `sectorScopeIds` validados contra unidades/setores da propria organizacao.
- Reset de senha recebe apenas a nova senha, atualiza o hash e nao retorna `passwordHash`.
- Mudancas relevantes registram auditoria: `user.create`, `user.update`, `user.deactivate`, `user.password_reset`.
- Tela de Configuracoes passou a incluir gestao de usuarios administrativos usando componentes operacionais existentes.

## Evidencias de validacao
- `npm run check`: passou com 22 testes.
- `npm run setup`: passou.
- `npm run build --workspace @sylembra/web`: passou.
- Smoke local: `/health`, login admin, listar usuarios, criar usuario RT, editar para `SUPERVISOR`, resetar senha, desativar usuario e consultar auditoria de reset.

## Riscos remanescentes
- A edicao de escopos na UI usa prompts com IDs para manter o delta pequeno; pode virar seletor dedicado em uma melhoria de UX posterior.
- Admin nao pode desativar a si mesmo para reduzir risco de lockout operacional.
