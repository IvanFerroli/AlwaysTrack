# TASK-AT-013 - Commercial roles and access

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-013-commercial-roles-access.md

## Objetivo
Introduzir roles comerciais para o produto AlwaysTrack.

## Entregue
- Roles comerciais: `ADMIN`, `SAC`, `FINANCEIRO`, `VENDEDOR`, `SUPERVISOR`, `GESTOR`.
- `RT` permanece apenas como role legada temporaria para nao quebrar rotas/testes antigos.
- Politica de acesso comercial adicionada para vendedor proprio, supervisor por grupo e visao ampla para admin/gestor/SAC/financeiro.

## Aceite
- Rotas comerciais aceitam apenas perfis comerciais.
- Vendedor e supervisor tem escopo comercial no service de notas.
