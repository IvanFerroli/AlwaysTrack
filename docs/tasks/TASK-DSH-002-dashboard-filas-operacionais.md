# TASK-DSH-002 - Dashboard filas operacionais

## Metadata
- status: proposed
- owner: frontend implementer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-DSH-002-dashboard-filas-operacionais.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Adicionar listas acionaveis para o que precisa de atencao hoje.

## Inputs
- documento central, secoes 7.2 e 7.3

## Dependencias
- satisfeitas: `TASK-DSH-001`
- em aberto: n/a

## Alvos explicitos
1. vencendo nos proximos 30 dias
2. vencidas por setor
3. pendencias por RT/unidade
4. uploads recentes e falhas de notificacao

## Fora de escopo
- graficos complexos

## Acceptance Criteria
1. Dashboard responde quem esta vencido, a vencer, pendente de validacao e com falha de notificacao.
2. Cada lista tem acao clara para detalhe.
3. Estados vazios sao tratados.

## Validacao
- smoke manual com seed variado

## Riscos
- dashboard ficar decorativo e nao operacional
