# TASK-RPT-004 - Relatorios de documentos

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-RPT-004-relatorios-documentos.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar relatorios de documentos aguardando validacao e recusados.

## Inputs
- documento central, secoes 8.5 e 8.6

## Dependencias
- satisfeitas: `TASK-RPT-001`, `TASK-FIL-004`
- em aberto: n/a

## Alvos explicitos
1. relatorio de documentos pendentes
2. relatorio de documentos recusados

## Fora de escopo
- analise automatica de documento

## Acceptance Criteria
1. Pendentes mostram tempo aguardando validacao e acao para revisar.
2. Recusados mostram motivo, recusado por e status atual.
3. Filtros comuns funcionam.

## Validacao
- testes de query
- smoke manual

## Riscos
- perder motivo de recusa no historico

## Evidencias de conclusao
- Implementados `GET /v1/reports/documents/pending` e `GET /v1/reports/documents/rejected`.
- Pendentes exibem tempo aguardando validacao.
- Recusados exibem motivo, responsavel pela recusa e status atual da licenca/documento.
- Tela de Relatorios exibe ambos usando filtros comuns.

## Validacao executada
- `npm run check` - 87 testes passaram.
- `npm run build --workspace @sylembra/web` - build passou.
- Smoke local: endpoints de documentos pendentes e recusados responderam `ok`.
