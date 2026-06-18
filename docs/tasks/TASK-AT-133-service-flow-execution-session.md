# TASK-AT-133 - Execucao auditavel de fluxo por atendimento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-133-service-flow-execution-session.md

## Objetivo unico
Permitir que o atendente inicie uma sessao de fluxo, marque etapas, registre decisoes e deixe rastro auditavel do atendimento sem armazenar dados sensiveis desnecessarios.

## Escopo
1. Criar sessao de fluxo com atendente, fluxo e timestamps.
2. Marcar etapas concluidas.
3. Registrar caminho escolhido e observacao curta.
4. Relacionar scripts copiados naquela sessao.
5. Export/consulta gerencial sem expor dados pessoais do cliente.

## Acceptance Criteria
1. Supervisor ve se fluxo foi seguido.
2. Atendente pode pausar/retomar sessao.
3. Eventos entram na auditoria.
