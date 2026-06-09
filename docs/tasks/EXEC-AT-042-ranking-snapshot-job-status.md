# EXEC-AT-042 - Ranking snapshot job status

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-09
- tasks: TASK-AT-052

## Entrega
- Contrato `QueueJobStatus` adicionado para observar jobs inline/BullMQ por `dedupeKey`.
- Consulta BullMQ adicionada com estados, tentativas, falha e timestamps quando `JOB_QUEUE_DRIVER=bullmq`.
- Fallback inline documentado no contrato como `not_tracked`, porque o resultado ja retorna no POST sincronamente.
- Endpoint `GET /v1/sales/campaigns/:campaignId/snapshots/job` criado para acompanhar o job piloto de snapshots de ranking.
- Teste unitario cobrindo status inline do job piloto.

## Validacao
- `npm run test --workspace @alwaystrack/api -- ranking-snapshot.jobs.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- Validacao BullMQ com Redis real segue pendente para stage/CI dedicado.
- UI ainda nao consome o endpoint de status.
