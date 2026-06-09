# ADR-005 - Filas BullMQ e backpressure

## Status
Aceita em 2026-06-09.

## Contexto
AlwaysTrack precisa crescer para operacao com muitos usuarios simultaneos. Fluxos como reprocessamento de DANFE por IA, snapshots de ranking, fanout de notificacoes, exportacoes grandes e digests de Wiki/FAQ nao devem prender request HTTP quando o volume aumentar.

## Decisao
Usar BullMQ + Redis como fila principal de jobs pesados em stage/producao.

O driver padrao local continua `inline`, via `JOB_QUEUE_DRIVER=inline`, para nao exigir Redis no dev basico. Ambientes que precisam de fila real devem configurar:

- `JOB_QUEUE_DRIVER=bullmq`
- `REDIS_URL=redis://...`
- `JOB_CONCURRENCY=2` ou valor calibrado por ambiente

## Contrato de job
Todo job deve definir:

- Nome de fila e nome de job estaveis.
- `dedupeKey` deterministica por organizacao e entidade.
- Idempotencia no service chamado.
- Retry com backoff exponencial.
- Logs de `job.completed` e `job.failed`.
- Worker separado via script `job:*`.
- Status retornado pela API quando a chamada virar assíncrona.

## Piloto
O piloto inicial e `ranking-snapshot.create`.

Motivo:
- E candidato real a job pesado.
- Tem baixo risco comparado a reprocessamento de DANFE por IA.
- Pode rodar inline localmente e em BullMQ quando Redis existir.

## Alternativas consideradas
- Manter tudo inline: simples, mas piora latencia sob carga.
- Criar fila caseira em SQLite: menos dependencia, mas pior para concorrencia e operacao.
- Usar apenas cron/worker sem fila: resolve agendamento, mas nao backpressure nem retry por job.

## Consequencias
- Produção precisa operar Redis.
- Jobs devem ser desenhados para nao duplicar notas, snapshots ou notificacoes.
- Dev local segue simples, mas testes de fila real precisam de Redis em stage/CI dedicado.
