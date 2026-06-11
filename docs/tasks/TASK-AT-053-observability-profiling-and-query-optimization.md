# TASK-AT-053 - Observability, profiling and query optimization

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-053-observability-profiling-and-query-optimization.md

## Modo
- mode: performance-hardening

## Objetivo unico
Instrumentar, perfilar e otimizar os gargalos reais de API, banco e frontend antes de escalar para 1000 usuarios simultaneos.

## Contexto minimo
Sem observabilidade, otimizacao vira chute. O projeto tem logs estruturados parciais, mas precisa de metricas por endpoint, queries lentas, tamanho de payload, memoria, latencia e renderizacao frontend.

## Alvos explicitos
1. Adicionar middleware de metricas HTTP: endpoint, status, duracao, tamanho.
2. Logar queries Prisma lentas em dev/stage.
3. Criar budget de payload para endpoints pesados.
4. Revisar endpoints:
   - `/v1/sales/documents`
   - `/v1/sales/ranking`
   - `/v1/sales/statements`
   - `/v1/wiki/pages`
   - `/v1/faq/threads`
   - `/v1/in-app-notifications`
5. Identificar N+1, includes excessivos e falta de paginacao.
6. Adicionar indices ou queries agregadas onde houver prova.
7. Avaliar cache seguro para leituras quentes: dashboard/ranking/wiki.
8. Criar relatorio de antes/depois.

## Fora de escopo
- Reescrever banco sem evidencia.
- Otimizacao cosmetica sem medicao.

## Acceptance Criteria
1. Endpoints principais tem metricas de latencia.
2. Existe relatorio com top gargalos.
3. Pelo menos uma rodada de otimizacao reduz p95 ou payload de endpoint critico.
4. Nenhuma otimizacao quebra tenancy/roles.

## Validacao
- `npm run check`
- `npm run perf:smoke`
- comparar relatorio antes/depois.

## Execucao 2026-06-09
- Middleware de metricas HTTP adicionado com agregacao em memoria por metodo/rota.
- Endpoint admin `GET /v1/diagnostics/http-metrics` criado.
- Rotas quentes de notas, ranking, extratos, Wiki, FAQ e notificacoes geram log estruturado.
- Slow request threshold configuravel por `HTTP_METRICS_SLOW_MS`.
- Slow query Prisma configuravel por `PRISMA_SLOW_QUERY_MS`.
- Relatorio baseline criado em `docs/performance/observability-report-2026-06-09.md`.
- Pendente: coletar antes/depois em stage com `perf:1000` e otimizar gargalo comprovado.

## Execucao 2026-06-11
- `scripts/perf-report.js` passou a coletar snapshots de `GET /v1/diagnostics/http-metrics` antes/depois de cada rodada Artillery.
- O resumo Markdown do report passa a registrar target, duracao, artefatos gerados e caminho dos diagnosticos.
- `docs/performance/report-template.md` padroniza a decisao de go/no-go, gargalos e follow-up de otimizacao.
- Pendente: usar o primeiro report stage para escolher uma otimizacao mensuravel de endpoint/query.

## Riscos
- Cache pode vazar dados entre tenants se mal desenhado.
- Otimizacao prematura pode complicar manutencao.
