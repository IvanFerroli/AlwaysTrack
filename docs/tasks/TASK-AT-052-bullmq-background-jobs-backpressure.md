# TASK-AT-052 - BullMQ jobs and backpressure

## Metadata
- status: completed-partial
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-052-bullmq-background-jobs-backpressure.md

## Modo
- mode: scalability-architecture

## Objetivo unico
Avaliar e implementar BullMQ para mover trabalhos pesados para filas, controlar concorrencia e proteger a API sob carga.

## Contexto minimo
Fluxos como extracao/reprocessamento de DANFE, notificacoes, snapshots, digest de Wiki/FAQ e futuras integracoes podem ficar lentos se executarem em request HTTP. Para 1000 usuarios simultaneos, a API precisa responder rapido e delegar trabalho pesado para workers.

## Alvos explicitos
1. Criar ADR sobre fila: BullMQ + Redis, alternativas e tradeoffs.
2. Identificar jobs candidatos:
   - DANFE AI/reprocessamento.
   - notificacoes in-app/event fanout pesado.
   - ranking snapshots.
   - importacoes/exportacoes CSV grandes.
   - digest Wiki/FAQ.
3. Definir contratos de job:
   - idempotencia;
   - dedupe key;
   - retry/backoff;
   - dead-letter;
   - timeout;
   - status observavel.
4. Implementar BullMQ em um fluxo piloto, preferindo reprocessamento de DANFE ou snapshots.
5. Criar worker separado e scripts `job:*`.
6. Adicionar testes unitarios e integracao com Redis de teste ou mock confiavel.
7. Expor status do job para UI quando necessario.

## Fora de escopo
- Transformar tudo em fila de uma vez.
- Exigir Redis no dev basico sem fallback/documentacao.

## Acceptance Criteria
1. ADR aprovada documenta quando usar fila.
2. Um fluxo pesado roda via BullMQ com retry/backoff e idempotencia.
3. API retorna rapido e usuario consegue acompanhar status.
4. Worker tem logs, metricas e tratamento de falhas.

## Validacao
- `npm run test --workspace @alwaystrack/api -- *jobs*`
- `npm run job:<novo-worker>`
- teste de carga comparando com/sem fila no fluxo piloto.

## Execucao 2026-06-09
- ADR criada em `docs/adr/ADR-005-filas-bullmq-backpressure.md`.
- BullMQ instalado no workspace da API.
- Contrato de fila criado em `services/api/src/core/jobs/queue.ts`.
- Piloto `ranking-snapshot.create` criado com fallback inline local e BullMQ quando `JOB_QUEUE_DRIVER=bullmq`.
- Worker separado criado em `services/api/src/jobs/ranking-snapshots.ts`.
- Script `npm run job:ranking-snapshots` criado.
- Status observavel do job de ranking snapshot exposto por dedupe key em `GET /v1/sales/campaigns/:campaignId/snapshots/job`.
- Pendente: validar BullMQ com Redis real em stage/CI dedicado e conectar status detalhado na UI.

## Riscos
- BullMQ exige Redis e muda operacao/deploy.
- Fila sem idempotencia pode duplicar nota, notificacao ou snapshot.
