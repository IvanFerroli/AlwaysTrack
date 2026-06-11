# EXEC-AT-054 - BullMQ Redis validation

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-052

## Objetivo
Fechar a validacao real do piloto BullMQ fora do fallback inline local.

## Entregas
- Teste opcional com Redis real em `services/api/src/core/jobs/queue.redis.test.ts`.
- Scripts `test:jobs:redis` no root e na API.
- Job CI `bullmq-redis` com service Redis.
- Profile `jobs` no compose exemplo com Redis e `ranking-snapshot-worker`.
- Guard em `scripts/check-env.js` exigindo `REDIS_URL` quando `JOB_QUEUE_DRIVER=bullmq`.

## Validacao
- `npm run test --workspace @alwaystrack/api -- ranking-snapshot.jobs.test.ts queue.redis.test.ts`
- `JOB_QUEUE_DRIVER=inline npm run env:check`
- `JOB_QUEUE_DRIVER=bullmq REDIS_URL=redis://127.0.0.1:6379 npm run env:check`

## Residual
Observar o primeiro CI com Redis e reproduzir em stage antes de mover jobs mais sensiveis, como IA de DANFE.
