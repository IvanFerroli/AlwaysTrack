# TASK-RPT-002 - Relatorios de vencidas e a vencer

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-RPT-002-relatorios-vencidas-vencer.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar relatorios de licencas vencidas e licencas a vencer.

## Inputs
- documento central, secoes 8.1 e 8.2

## Dependencias
- satisfeitas: `TASK-RPT-001`
- em aberto: n/a

## Alvos explicitos
1. endpoints de relatorio
2. telas com filtros e colunas essenciais

## Fora de escopo
- PDF

## Acceptance Criteria
1. Vencidas mostra dias vencidos, ultima notificacao e ultimo documento.
2. A vencer suporta janelas 7, 15, 30, 60 e personalizado.
3. Filtros por unidade, setor, RT e tipo funcionam.

## Validacao
- testes de query
- smoke manual com seed

## Riscos
- dias restantes/vencidos calculados de forma inconsistente

## Evidencias de conclusao
- Implementados `GET /v1/reports/licenses/expired` e `GET /v1/reports/licenses/expiring`.
- Relatorio de vencidas inclui dias vencidos, ultima notificacao e ultimo documento.
- Relatorio de a vencer suporta `windowDays` e periodo customizado por `from`/`to`.
- Tela de Relatorios exibe ambos com filtros comuns.

## Validacao executada
- `npm run check` - 87 testes passaram.
- `npm run build --workspace @alwaystrack/web` - build passou.
- Smoke local: endpoints de vencidas e a vencer responderam `ok`.
