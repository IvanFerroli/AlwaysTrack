# TASK-AT-001 - Product baseline AlwaysTrack

## Metadata
- status: completed
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-001-product-baseline-alwaystrack.md

## Modo
- mode: planning

## Objetivo unico
Declarar o baseline ativo do AlwaysTrack como starter vertical de licencas/compliance.

## Contexto minimo
A transicao SyLembra -> AlwaysTrack foi encerrada em `EXEC-TMP-010`. A proxima etapa precisa nascer como trilha propria, sem reabrir tasks historicas.

## Inputs
- `docs/adr/ADR-002-fronteira-template-alwaystrack.md`
- `docs/tasks/ROADMAP.md`
- `docs/operations/orchestrator-state.md`

## Dependencias
- satisfeitas: transicao documental e clone limpo validados
- em aberto: definicao de beta externo

## Alvos explicitos
1. `docs/specs/SPEC-AT-001-product-baseline.md`
2. `docs/project/intake.md`
3. `docs/tasks/ROADMAP.md`
4. `docs/operations/orchestrator-state.md`

## Fora de escopo
- Refatorar dominio tecnico.
- Alterar schema Prisma.
- Reabrir manifests arquivados em `docs/archive/sylembra/tasks/`.

## Checklist
1. Criar baseline de produto.
2. Atualizar intake e roadmap para trilha `TASK-AT-*`.
3. Registrar ciclo no estado do orquestrador.
4. Validar com `npm run check`.
