# TASK-AT-378 - Fundacao aditiva de Campanhas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-378-sac-campaign-additive-foundation.md

## Modo
- mode: migration

## Objetivo unico
Reaproveitar infraestrutura e componentes de campanhas com dominio SAC explicito, preservando campanhas e snapshots comerciais como legado.

## Contexto minimo
`SalesCampaign` referencia `SalesGroup` e `RankingSnapshot`; renomear a tabela ou payload faria campanhas antigas parecerem SAC. O reuso deve ser aditivo e semanticamente isolado.

## Dependencias
- satisfeitas: TASK-AT-365, TASK-AT-373 e TASK-AT-376.
- em aberto: n/a.

## Alvos explicitos
1. Discriminador/migracao de dominio e contratos SAC de campanha.
2. Reuso extraido de validacao, lifecycle e componentes visuais neutros.
3. Snapshot/resultados SAC separados de `RankingSnapshot` legado.

## Fora de escopo
- Converter campanha comercial em campanha SAC.
- Usar posicao de ranking como metrica SAC.

## Checklist
1. Classificar todas as campanhas atuais como `SALES_LEGACY` por backfill idempotente.
2. Criar alvo SAC por time/audiencia e metrica versionada.
3. Separar rotas `/v1/sac/campaigns` da ponte `/v1/sales/**`.
4. Reusar somente codigo neutro ou extrair helper com testes de nao regressao.
5. Preservar ids, datas e snapshots legados sem payload rewrite.

## Acceptance Criteria
1. Consulta SAC nunca retorna campanha ou snapshot comercial.
2. Consulta legada nao interpreta resultado SAC como ranking.
3. Migracao preserva contagens e relacoes anteriores.
4. Reuso reduz duplicacao sem manter nomenclatura `sales` na nova API/UI.

## Validacao
- comandos/checks: migration/backfill tests, contract tests dos dois dominios e `git diff --check`.
- revisao manual: comparar campanha legada antes/depois e criar campanha SAC vazia.

## Riscos
- Filtro de dominio ausente vazar campanha legada na nova superficie.

## Proximo passo provavel
TASK-AT-379

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: isolamento de dominio obrigatorio em toda query.
