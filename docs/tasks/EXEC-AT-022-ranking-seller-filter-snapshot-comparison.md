# EXEC-AT-022 - Ranking seller filter and snapshot comparison

## Metadata
- task-id: AT-019C
- execution-id: EXEC-AT-022
- mode: runtime
- execution-mode: batch-worker
- orchestrator: olympus_orchestrator
- specialist: worker
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Revisado o residual de `TASK-AT-019` e a UI existente de Ranking/Campanhas.
2. Adicionado filtro visual de vendedor no Ranking para perfis com escopo amplo.
3. Reutilizado o contrato existente `sellerProfileId` em `GET /v1/sales/ranking`.
4. Adicionado comparativo leve entre snapshots recentes usando `payloadJson` ja persistido.
5. Executadas validacoes de typecheck e build web.

## Artefatos materiais
1. `apps/web/src/main.tsx`
2. `docs/tasks/EXEC-AT-022-ranking-seller-filter-snapshot-comparison.md`

## Evidências observáveis
1. `npm run typecheck --workspace @alwaystrack/web` - passou.
2. `npm run build --workspace @alwaystrack/web` - passou.
3. Ranking exibe vendedor para `ADMIN`, `GESTOR` e `SUPERVISOR`; Campanhas exibe comparativo de dois snapshots com posicao, movimento, valor, itens e notas.

## Blockers
Nenhum.

## Nota para próximo ciclo
As opcoes de vendedor dependem do ranking retornado pelos filtros atuais, pois ainda nao existe endpoint dedicado de vendedores para esse seletor. O comparativo historico fica limitado aos snapshots recentes retornados por `GET /v1/sales/campaigns/snapshots` e ainda nao tem teste visual automatizado.
