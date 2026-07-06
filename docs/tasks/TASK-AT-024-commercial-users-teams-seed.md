# TASK-AT-024 - Commercial users and teams seed

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-024-commercial-users-teams-seed.md

## Objetivo
Dar base operacional inicial para usuarios, vendedores e times comerciais.

## Entregue
- Seed cria admin, SAC, financeiro, vendedor e supervisor.
- Seed cria `SalesGroup` e `SellerProfile` vinculado a usuario vendedor.
- UI possui entrada `Usuarios/Times` como modulo comercial reservado.

## Fora de escopo
- CRUD completo de vendedores e grupos.
- Vinculo Google real.

## Encerramento
O seed comercial permanece deterministico e o escopo posterior foi entregue pelo CRUD administrativo de usuarios, papeis, vendedores e grupos. Login Google e allowlist pertencem ao bloco de autenticacao do beta e nao sao pendencias deste seed.
