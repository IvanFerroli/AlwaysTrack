# RUNBOOK-006 - Lifecycle e probes da API

## Metadata
- status: active-local
- owner: platform-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/runbooks/RUNBOOK-006-api-runtime-lifecycle.md
- related-task: docs/tasks/TASK-AT-332-runtime-readiness-graceful-lifecycle.md

## Objetivo
Operar os probes de liveness/readiness e o encerramento gracioso da API sem confundir dependencia degradada com processo travado.

## Contrato operacional
- `GET /health/live`: confirma apenas que o processo HTTP responde. Nao consulta banco ou Redis.
- `GET /health/ready`: consulta Prisma e, somente com `JOB_QUEUE_DRIVER=bullmq`, Redis. Cada dependencia possui timeout e a resposta publica apenas `up` ou `down`.
- `GET /health`: permanece como liveness legado durante a transicao dos consumidores.
- Em drain, readiness retorna `503`, novas requisicoes retornam `503` com `connection: close` e liveness continua respondendo enquanto o listener existir.
- `SIGTERM` e `SIGINT` iniciam o mesmo shutdown idempotente. O processo para de aceitar trabalho, drena HTTP e desconecta Prisma dentro de 10 segundos; ao exceder o prazo, conexoes HTTP sao encerradas e o exit code indica falha.

O processo HTTP atual nao hospeda Worker BullMQ nem WebSocket e nao mantem cliente Redis persistente. Workers possuem entrypoints separados; por isso nenhum closer ficticio e registrado na API. O runtime aceita closers tipados para jobs, WebSocket e Redis quando esses recursos passarem a residir no processo.

## Preflight e validacao local
1. Inicie a API sem credenciais externas.
2. Rode `curl -i http://127.0.0.1:3333/health/live` e espere `200`.
3. Rode `curl -i http://127.0.0.1:3333/health/ready`; espere `200` no modo inline com banco acessivel ou `503` sem reinicio do processo se uma dependencia obrigatoria estiver indisponivel.
4. Envie `SIGTERM` uma unica vez e confira os eventos `api.shutdown.started` e `api.shutdown.completed` sem secrets ou URLs de dependencia.
5. Confirme que a porta foi liberada e que uma nova instancia consegue atingir readiness.

## Orquestrador
- Liveness deve controlar restart do processo.
- Readiness deve remover a instancia do trafego sem reinicia-la.
- O termination grace period deve ser maior que 10 segundos.
- Falha de Redis nao derruba readiness quando `JOB_QUEUE_DRIVER=inline`; com BullMQ, Redis e obrigatorio.

## Rollback e escalacao
Reverta a imagem da API se os probes divergirem deste contrato. Nao troque readiness por liveness para mascarar dependencia indisponivel. Escale para `platform-maintainers` se o drain exceder 10 segundos e registre apenas nomes de recursos e duracoes, nunca DSN, credenciais ou payloads.

## Evidencia e limites
Os testes automatizados usam HTTP local e dependencias fake. Nenhuma evidencia production-like ou live foi produzida nesta task; Redis real, balanceador e sinais do orquestrador continuam pendentes de ambiente autorizado.
