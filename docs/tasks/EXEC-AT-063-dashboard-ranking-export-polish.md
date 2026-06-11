# EXEC-AT-063 - Dashboard and ranking export polish

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-064-dashboard-ranking-export-polish.md

## Objetivo
Polir exportacoes comerciais para que ranking, dashboard e extratos sejam material simples de reuniao.

## Entregas
1. Criadas rotas `GET /v1/sales/ranking.csv` e `GET /v1/sales/dashboard.csv`.
2. Export de extrato manteve os filtros da tela e passou a incluir metadados do relatorio.
3. CSVs incluem periodo, data de geracao, campanha/grupo/vendedor e bucket quando aplicavel.
4. Arquivos sao nomeados com prefixo, periodo filtrado e data de geracao.
5. Ranking e dashboard ganharam botoes de export usando exatamente os filtros ativos da UI.
6. Exports comerciais geram auditoria: `sales_ranking.export`, `sales_dashboard.export` e `sales_statements.export`.
7. Testes cobrem CSV de ranking, dashboard, extrato vazio e nome de arquivo por periodo.

## Decisoes
- CSV segue como formato principal; PDF permanece fora de escopo.
- Auditoria fica no handler para registrar o download sensivel mesmo quando o relatorio nao tem linhas.
- Metadados ficam no topo do CSV para facilitar leitura em planilha sem perder contexto da reuniao.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`

## Riscos residuais
- Planilhas que esperavam o extrato antigo sem linhas de metadados podem precisar ignorar as primeiras linhas antes do cabecalho tabular.
