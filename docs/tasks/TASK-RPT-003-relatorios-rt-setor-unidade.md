# TASK-RPT-003 - Relatorios por RT, setor e unidade

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-RPT-003-relatorios-rt-setor-unidade.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Mostrar carga, risco e pendencias por responsavel e area.

## Inputs
- documento central, secoes 8.3 e 8.4

## Dependencias
- satisfeitas: `TASK-RPT-001`
- em aberto: n/a

## Alvos explicitos
1. relatorio por RT
2. relatorio por setor/unidade

## Fora de escopo
- metas/pagamento

## Acceptance Criteria
1. Por RT mostra totais, regulares, a vencer, vencidas, validacoes e falhas.
2. Por setor/unidade mostra percentuais de pendencia.
3. Dados respeitam escopo do usuario.

## Validacao
- testes de agregacao
- smoke manual

## Riscos
- numeros divergirem do dashboard

## Evidencias de conclusao
- Implementados `GET /v1/reports/groups/rt` e `GET /v1/reports/groups/areas`.
- Agregacoes mostram totais, regulares, a vencer, vencidas, validacoes pendentes, falhas e percentual de pendencia.
- Dados usam o mesmo escopo de acesso operacional dos demais modulos.
- Tela de Relatorios exibe resumo por RT e por unidade/setor.

## Validacao executada
- `npm run check` - 87 testes passaram.
- `npm run build --workspace @sylembra/web` - build passou.
- Smoke local: endpoints de RT e area responderam `ok`.
