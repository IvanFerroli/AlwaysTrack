# Performance Gates

## Metadata
- status: active
- owner: performance-maintainers
- last-updated: 2026-06-09

## Ferramenta
Artillery e a ferramenta padrao de carga HTTP do AlwaysTrack.

## Comandos
- `npm run perf:smoke`: carga baixa local contra `http://localhost:3333`.
- `npm run perf:1000 -- --target=<url>`: benchmark de leitura autenticada contra ambiente alvo.

## Preparacao
1. Suba o ambiente com seed estavel:
   `SEED_ADMIN_PASSWORD=AlwaysTrackPerf123! npm run up -- --no-studio --no-open`
2. Rode `SEED_ADMIN_PASSWORD=AlwaysTrackPerf123! npm run perf:smoke`.
3. Para ambiente remoto, passe `--target` e garanta um usuario admin de teste com a senha em `SEED_ADMIN_PASSWORD`.

## SLO inicial
- p95 read API <= 500 ms no ambiente alvo.
- p95 write critico <= 1000 ms.
- erro HTTP < 1%.
- memoria sem crescimento descontrolado.

## Observabilidade
- `GET /v1/diagnostics/http-metrics` mostra metricas agregadas em memoria para ADMIN.
- `HTTP_METRICS_SLOW_MS` controla warning de request lento.
- `PRISMA_SLOW_QUERY_MS` controla warning de query Prisma lenta.
- Relatorio baseline: `docs/performance/observability-report-2026-06-09.md`.

## Observacao
SQLite local nao prova capacidade para 1000 usuarios simultaneos. O gate de 1000 deve rodar em stage/producao-like.
