# EXEC-AT-043 - Ranking snapshot job status UI

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-10
- tasks: TASK-AT-052

## Entrega
- UI de Campanhas passou a guardar status de job por campanha.
- Ao criar snapshot, a resposta inline/BullMQ alimenta uma badge operacional na linha da campanha.
- Jobs enfileirados consultam o endpoint `GET /v1/sales/campaigns/:campaignId/snapshots/job`.
- Botao `Atualizar job` adicionado para admins/gestores/supervisores acompanharem o status manualmente.
- Status de fila traduzido para labels operacionais como `Na fila`, `Processando`, `Concluido`, `Falhou` e `Fila indisponivel`.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- Sem Redis real local, a validacao visual cobre o fallback inline e o contrato compilado; estados BullMQ reais ainda precisam de stage/CI dedicado.
