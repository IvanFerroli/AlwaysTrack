# TASK-AT-016 - Seller DANFE upload

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-016-seller-danfe-upload.md

## Objetivo
Permitir upload autenticado de DANFE/nota fiscal por vendedor.

## Entregue
- Novo core `services/api/src/core/sales-documents`.
- Rotas `/v1/sales/documents` para listagem e upload.
- Upload grava arquivo no storage privado e metadados em `SalesDocument`.
- Status inicial `UPLOADED`; fila administrativa ja lista notas pendentes.

## Aceite
- Vendedor envia PDF/imagem e a nota fica vinculada ao seu perfil.
- Admin/gestor/SAC/financeiro/supervisor conseguem listar conforme escopo.
- Testes cobrem parse, escopo, upload e dashboard.
