# Performance Gates

## Metadata
- status: active
- owner: performance-maintainers
- last-updated: 2026-06-18

## Ferramenta
Artillery e a ferramenta padrao de carga HTTP do AlwaysTrack.

## Comandos
- `npm run perf:smoke`: carga baixa local contra `http://localhost:3333`.
- `npm run perf:1000 -- --target=<url>`: benchmark de leitura autenticada contra ambiente alvo.
- `npm run perf:smoke:report -- --target=<url>`: gera JSON/HTML/snapshot diagnostico para smoke local ou stage leve.
- `npm run perf:1000:report -- --target=<url>`: gera JSON/HTML/snapshot para ambiente stage/producao-like; falha se o alvo for localhost.
- `npm run up`: dispara automaticamente um smoke local de carga depois que a API responde, salvo `--no-perf-smoke`.

## Preparacao
1. Suba o ambiente com seed estavel. O `up` define senhas locais deterministicas quando nenhuma `SEED_*_PASSWORD` for passada:
   `npm run up -- --skip-install --no-studio --no-open`
2. Por padrao o `up` ja roda `perf:smoke:report` em background. Para rodar manualmente:
   `SEED_ADMIN_PASSWORD=AlwaysTrackDev123! npm run perf:smoke:report -- --target=http://localhost:3333`
3. Para ambiente remoto, passe `--target` e garanta um usuario admin de teste com a senha em `SEED_ADMIN_PASSWORD`.
4. Para relatorios versionaveis operacionalmente, use o template `docs/performance/report-template.md`; os artefatos gerados ficam em `docs/performance/reports/` e nao devem ser commitados.

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
Qualquer execucao local do Artillery deve ser tratada como smoke/diagnostico. A unica evidencia valida para fechar o alvo de 1000 usuarios e `perf:1000:report` contra ambiente stage/producao-like com recursos, banco e Redis equivalentes ao deploy pretendido.
