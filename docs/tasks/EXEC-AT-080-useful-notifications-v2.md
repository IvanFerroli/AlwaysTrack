# EXEC-AT-080 - Notificacoes mais uteis

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- task: TASK-AT-080

## Entrega
O centro de notificacoes in-app ficou mais acionavel, com filtro de nao lidas, agrupamento por tipo e navegacao interna mais confiavel.

## Backend
- `GET /v1/in-app-notifications` aceita:
  - `unreadOnly=1`
  - `type=<tipo>`
- Resposta agora inclui `groups`, com total e nao lidas por tipo no conjunto retornado.
- Cobertura unitária para parser, filtros e agrupamento simples.

## Frontend
- Popover de notificacoes mostra total de nao lidas.
- Usuario pode alternar filtro de nao lidas.
- Usuario pode filtrar por tipo via chips.
- Cada notificacao mostra alvo/link quando existir.
- Links internos agora reconhecem `/audit`, `/settings` e caminhos com query.

## Limites conhecidos
- O agrupamento e propositalmente simples e baseado no conjunto retornado, sem painel analitico completo.
- Notificacoes arquivadas/removidas no destino ainda dependem da tela de destino lidar com estado vazio.
