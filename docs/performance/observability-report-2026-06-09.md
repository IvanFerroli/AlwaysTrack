# Observability Report - 2026-06-09

## Metadata
- status: baseline
- owner: performance-maintainers
- related-task: TASK-AT-053

## Entrega
- Middleware HTTP registra metricas em memoria por metodo/rota.
- Rotas quentes de notas, ranking, extratos, Wiki, FAQ e notificacoes geram log estruturado.
- Requests lentos acima de `HTTP_METRICS_SLOW_MS` geram warning.
- Queries Prisma acima de `PRISMA_SLOW_QUERY_MS` geram warning com query truncada.
- Admin pode consultar snapshot em `GET /v1/diagnostics/http-metrics`.

## Rotas monitoradas explicitamente
- `GET /v1/sales/documents`
- `GET /v1/sales/ranking`
- `GET /v1/sales/statements`
- `GET /v1/wiki/pages`
- `GET /v1/faq/threads`
- `GET /v1/in-app-notifications`

## Budgets iniciais
- Read API p95 alvo: <= 500 ms em ambiente alvo.
- Write critico p95 alvo: <= 1000 ms.
- Payload medio de lista operacional: revisar se passar de 250 KB.
- Payload maximo de lista operacional: revisar se passar de 1 MB.

## Observacoes de desenho
- Metricas em memoria sao diagnostico local/stage, nao substituem Prometheus/APM.
- Nao ha cache nesta rodada para evitar risco de vazamento entre tenants.
- A proxima rodada deve cruzar Artillery com `/v1/diagnostics/http-metrics` antes/depois.
