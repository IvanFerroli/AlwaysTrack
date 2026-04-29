# TASK-RPT-006 - Exportacao CSV

## Metadata
- status: proposed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-RPT-006-exportacao-csv.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Adicionar exportacao CSV para relatorios principais usando as mesmas queries validadas.

## Inputs
- documento central, secao 8.9

## Dependencias
- satisfeitas: `TASK-RPT-002`, `TASK-RPT-003`, `TASK-RPT-004`, `TASK-RPT-005`
- em aberto: n/a

## Alvos explicitos
1. endpoint/export CSV
2. botoes de exportacao

## Fora de escopo
- Excel nativo
- PDF elaborado

## Acceptance Criteria
1. CSV respeita filtros ativos.
2. Exportacao nao duplica logica de query.
3. Campos sensiveis sao limitados ao escopo do usuario.

## Validacao
- teste de headers/linhas CSV
- smoke manual de download

## Riscos
- exportar dados fora do escopo
