# TASK-USR-001 - Gestao de usuarios superiores

## Metadata
- status: proposed
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
