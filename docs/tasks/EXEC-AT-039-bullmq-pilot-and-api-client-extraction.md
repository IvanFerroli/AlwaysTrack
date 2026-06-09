# EXEC-AT-039 - BullMQ pilot and API client extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-09
- tasks: TASK-AT-052, TASK-AT-054

## Entrega
- ADR BullMQ/Redis criada em `docs/adr/ADR-005-filas-bullmq-backpressure.md`.
- BullMQ instalado no workspace da API.
- Contrato de fila criado com driver inline por padrao e BullMQ opcional.
- Piloto `ranking-snapshot.create` conectado ao endpoint de snapshot de campanhas.
- Worker `job:ranking-snapshots` criado.
- Cliente API web extraido para `apps/web/src/api.ts`.

## Riscos residuais
- BullMQ real ainda precisa ser validado com Redis em stage/CI dedicado.
- Endpoint de snapshot retorna metadata de job; UI atual apenas recarrega lista.
- `main.tsx` ainda e o maior hotspot e precisa de extracao por dominio.
