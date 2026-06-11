# TASK-AT-051 - Load and performance gate for 1000 concurrent users

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-051-load-performance-1000-users-gate.md

## Modo
- mode: performance-validation

## Objetivo unico
Criar um gate de carga para validar a plataforma com meta operacional de 1000 usuarios simultaneos sem degradacao inaceitavel.

## Contexto minimo
Hoje nao ha evidencia de carga. O alvo de 1000 simultaneos exige medir login, dashboard, notas, ranking, Wiki, FAQ e notificacoes sob concorrencia. BullMQ nao e ferramenta de carga; ele ajuda em filas/backpressure. Para carga HTTP, usar Artillery como ferramenta preferida; k6/autocannon ficam como alternativas se Artillery nao cobrir algum caso.

## Alvos explicitos
1. Definir SLO inicial:
   - p95 API read <= 500 ms em ambiente alvo.
   - p95 write critico <= 1000 ms.
   - erro HTTP < 1%.
   - sem crescimento descontrolado de memoria.
2. Usar Artillery como ferramenta principal de carga HTTP.
3. Criar cenarios:
   - 1000 usuarios lendo dashboard/ranking/extratos.
   - mix realista com upload/review de DANFE.
   - Wiki/FAQ/notificacoes.
   - login/session refresh.
4. Separar carga de smoke local, stage e benchmark.
5. Coletar metricas de CPU, memoria, latencia, throughput e erros.
6. Produzir relatorio em `docs/performance/`.
7. Definir baseline e budget regressivo.

## Fora de escopo
- Prometer 1000 usuarios em notebook local.
- Testar provider externo real sob carga sem budget/limite.
- Resolver todos os gargalos encontrados nesta task.

## Acceptance Criteria
1. `npm run perf:smoke` roda Artillery local com baixa carga.
2. `npm run perf:1000` roda Artillery contra ambiente configurado.
3. Relatorio registra resultado, gargalos e proxima acao.
4. Carga nao depende de dados manuais e tem seed proprio.

## Validacao
- `npm run perf:smoke`
- `npm run perf:1000 -- --target=<url>`
- `npm run check`

## Execucao 2026-06-09
- Artillery instalado e configurado como ferramenta principal.
- Criados `tests/performance/alwaystrack-smoke.yml` e `tests/performance/alwaystrack-1000.yml`.
- Criados scripts `perf:smoke` e `perf:1000`.
- Criado `docs/performance/README.md` com SLO inicial e preparo.
- `perf:smoke` validado contra API isolada em `3334`: 160 respostas 200, 0 falhas de VU, p95 ~31ms.
- Pendente: rodar `perf:1000` em ambiente stage/producao-like; SQLite local nao prova meta de 1000 simultaneos.

## Execucao 2026-06-11
- Workflow de relatorio criado em `scripts/perf-report.js`.
- Scripts `perf:smoke:report` e `perf:1000:report` adicionados para gerar JSON, HTML e resumo Markdown em `docs/performance/reports/`.
- O modo `1000` bloqueia alvo localhost/loopback para evitar evidencia falsa de escala em notebook local.
- Relatorio template criado em `docs/performance/report-template.md`.
- `docs/performance/README.md` atualizado com smoke diagnostico, stage gate e interpretacao de resultados.
- Pendente: executar `SEED_ADMIN_PASSWORD=... npm run perf:1000:report -- --target=<stage-url>` em ambiente stage/producao-like.

## Riscos
- SQLite pode ser gargalo estrutural para 1000 simultaneos.
- Upload de arquivos e IA real precisam de cenarios separados para nao misturar gargalo de provider.
