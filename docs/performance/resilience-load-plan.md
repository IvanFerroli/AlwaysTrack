# Plano de carga e resiliencia

## Metadata
- status: active
- owner: performance-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/performance/resilience-load-plan.md

## Escopo executavel
`tests/performance/alwaystrack-resilience.yml` concentra a mistura de leitura, escrita CaseFlow, cache stampede, enqueue/status de fila e diagnostico operacional. A senha vem somente de `SEED_ADMIN_PASSWORD`; massa e identificadores sao sinteticos.

| Perfil | Volume e duracao | Objetivo | Criterio de parada |
| --- | --- | --- | --- |
| `mixed` | rampa 2 para 10 chegadas/s por 60 s; 10/s por 120 s | baseline representativo de leitura e escrita | erro Artillery > 1%, p95 > 1 s ou p99 > 2 s |
| `stress` | rampa 10 para 100/s por 120 s; 100/s por 60 s | localizar saturacao e backpressure | mesmos thresholds; interromper tambem se readiness falhar |
| `spike` | 5/s por 30 s; 150/s por 30 s; recuperacao 5/s por 60 s | medir degradacao e recuperacao apos pico | mesmos thresholds; readiness deve se recuperar na ultima fase |
| `soak` | 15/s por 30 min | detectar crescimento de memoria, handles, fila e latencia | mesmos thresholds; interromper por crescimento monotono sem estabilizacao |

## Execucao
1. Preparar ambiente isolado com massa descartavel e providers externos desabilitados/fake.
2. Validar o plano: `node scripts/validate-performance-plan.mjs`.
3. Executar um perfil: `SEED_ADMIN_PASSWORD=<senha-sintetica> npx artillery run --environment mixed tests/performance/alwaystrack-resilience.yml --target=<api-url> --output=<report.json>`.
4. Repetir com `stress`, `spike` e `soak`; capturar CPU, RSS, event loop, conexoes, profundidade/idade da fila e readiness no monitor do ambiente.
5. Produzir HTML com `npx artillery report <report.json>` e preencher `docs/performance/report-template.md`.

## Evidencia e decisao
- Execucao em SQLite/driver inline local e `local`; valida scripts e regressao grosseira, mas nao capacidade.
- Fechamento da task exige repeticao `production-like` com Postgres, Redis/BullMQ, storage e recursos equivalentes ao alvo.
- Reconnect de Extension/Host e validado funcionalmente pela TASK-AT-317/318; a medicao sob carga deve correlacionar `companion.reconnect` no monitor/SLO da TASK-AT-324.
- Nenhum resultado autoriza rollout se faltar perfil, telemetria de recursos, relatorio sanitizado ou owner aprovador.
