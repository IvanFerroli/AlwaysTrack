# TASK-AT-086 - Avisos: integracao com Central Operacional Hoje

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-086-announcements-operational-today-integration.md
- execution: docs/tasks/EXEC-AT-086-announcements-operational-today-integration.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.4
- dependencias: `TASK-AT-083`, `TASK-AT-084`, `TASK-AT-069`.

## Objetivo unico
Mostrar avisos ativos do dia na Central Operacional Hoje com CTA real para leitura.

## Escopo funcional
1. Agregado `/v1/operations/today` inclui avisos ativos/vigentes.
2. Card ou lista curta de avisos do dia no dashboard.
3. Destaque visual para prioridade alta/critica.
4. CTA abre aba Avisos com filtro aplicado ou aviso direto.
5. Estado vazio quando nao houver comunicados relevantes.

## Acceptance Criteria
1. Aviso publicado e vigente aparece na Central para publico alvo.
2. Clique leva a uma acao real.
3. Avisos expirados/arquivados nao poluem a Central.
4. Typecheck web/api passa.

## Riscos
- Central ficar carregada; mostrar apenas top 3 e contador.
