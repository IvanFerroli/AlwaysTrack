# TASK-ADM-001 - Paginação e Limites de Armazenamento Runtime

## Metadata
- task-id: TASK-ADM-001
- status: in-progress
- owner: olympus-taskyfier
- priority: high
- capability: runtime-observability
- source-of-truth: docs/operations/taskyfier-memory.md (Dependencias abertas)

## Objetivo
Implementar paginação nos endpoints de listagem de logs/memória e criar um mecanismo de limpeza (pruning) para evitar o crescimento descontrolado do banco de dados local.

## Escopo
1.  **shared-types**: Validar/ajustar `ListPayload` para suporte a paginação (já existente, verificar uso).
2.  **StateStore**: Adicionar `limit` e `offset` opcionais em `listMemoryEntries`, `listDecisionLogs`, `listAgentRuns` e `listSkillExecutions`.
3.  **PrismaStateStore**: Implementar lógica de `take` e `skip`.
4.  **Pruning**: Implementar `pruneOldEntries(limit)` no store para remover registros antigos (AgentRuns e MemoryEntries).
5.  **Handlers API**: Atualizar handlers de `memory` e `audit` para aceitar parâmetros de query.
6.  **Admin Route**: Criar `POST /v1/admin/prune` para disparo manual da limpeza.

## Critérios de Aceite
- [ ] Requisições com `limit` e `offset` retornam o subset correto de dados.
- [ ] Chamada de pruning remove registros excedentes respeitando a ordem cronológica (mantém os mais novos).
- [ ] `npm run check` e `npm run smoke` (se disponível) passam sem regressões.

## Handoff Formal
- handoff_to: olympus-orchestrator
- constraints: manter compatibilidade com contratos existentes; não alterar lógica de negócio do matching.
