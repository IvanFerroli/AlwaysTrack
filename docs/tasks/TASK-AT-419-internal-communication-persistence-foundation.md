# TASK-AT-419 - Persistência base da Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-419-internal-communication-persistence-foundation.md

## Modo
- mode: migration
- priority: P0
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Persistence

## Origem documental
- `TASK-AT-417` e `TASK-AT-418`.

## Problema
Não há entidades próprias para conversa, participante, mensagem e estado de leitura. Adaptar FAQ, Avisos ou `InAppNotification` perderia semântica de chat e criaria integridade frágil.

## Objetivo único
Criar schema e migration aditivos para conversas internas, memberships, mensagens e cursores de leitura com integridade tenant-scoped.

## Contexto mínimo
FAQ, Avisos e notificações oferecem padrões úteis, mas não possuem os invariantes de conversa, sequência, participant membership e read cursor.

## Inputs
- Agregados/invariantes da `TASK-AT-417`.
- RBAC/escopos da `TASK-AT-418`.
- Schema de Organization, User e SupportTeam.

## Escopo
1. Modelar `InternalConversation`, `InternalConversationMember`, `InternalMessage` e `InternalConversationReadState`.
2. Suportar `GENERAL`, `DIRECT`, `TEAM` e `GROUP` com invariantes por tipo.
3. Preservar sequência/ordenação estável, idempotency key e soft moderation status.
4. Criar índices para lista, histórico e unread.
5. Seedar de forma idempotente o canal geral por organização de demonstração.

## Fora de escopo
- API, UI, WebSocket, presença e anexos.
- Replies, reações, edição ou hard delete.
- Backfill a partir de FAQ/Avisos.

## Arquivos ou domínios candidatos
- `services/api/prisma/schema.prisma`.
- `services/api/prisma/migrations/`.
- `services/api/prisma/seed.ts`.
- `services/api/src/core/` — módulo futuro de Comunicação.

## Requisitos funcionais
1. Canal geral é único por organização.
2. Direct evita duplicata para o mesmo par normalizado.
3. Team referencia equipe do mesmo tenant; group mantém membros explícitos.
4. Mensagem é append-only no MVP e possui autor, conversa, sequência e timestamps.
5. Read state permite calcular unread sem criar um registro por mensagem lida.

## Requisitos de permissão, tenant e auditoria
1. Todas as FKs lógicas são validadas no service além das constraints disponíveis.
2. Não existe vínculo cross-tenant entre conversa, membro, equipe, autor e read state.
3. Migration é aditiva e rollback não remove dados preexistentes.
4. Conteúdo não é duplicado em audit log.

## Checklist de execução
1. Modelar agregados e chaves normalizadas.
2. Definir índices/constraints de lista, histórico e unread.
3. Criar migration aditiva e rollback compatível.
4. Criar seed geral idempotente.
5. Validar concorrência e integridade cross-tenant.

## Critérios de aceite
1. Constraints impedem segundo canal geral e direct duplicado no mesmo tenant.
2. Índices suportam paginação por conversa e lista por participante.
3. Read cursor é monotônico e não aponta para mensagem de outra conversa.
4. Models existentes de FAQ, Avisos, notificações e AlwaysChat permanecem inalterados.

## Testes esperados
- Testes de migration e schema em banco limpo e upgrade.
- Concorrência simulada de canal geral/direct e idempotência de mensagem.
- Casos cross-tenant, sequência, cursor monotônico e seed repetido.
- `npm run prisma:generate`, typecheck API e `git diff --check`.

## Riscos
- Unicidade de direct depender de chave normalizada incorreta.
- Read cursor inconsistente gerar contagem negativa ou mensagens eternamente não lidas.

## Dependências
- satisfeitas: `SupportTeam`, `SupportTeamMembership`, `User` e `Organization` existentes.
- em aberto: `TASK-AT-417` e `TASK-AT-418` concluídas.

## Blockers possíveis
- Chave canônica de direct não definida.
- Constraint production-like não comprovável apenas em SQLite.

## Definição de pronto
1. Schema/migration aditivos e seed idempotente validados.
2. Invariantes documentados e cobertos por testes.
3. Nenhum dado legado é migrado ou reinterpretado.

## Evidência esperada
- Diagrama dos models e saída dos testes de migration/integridade.
- Plano de rollback compatível.

## Próximo passo provável
`TASK-AT-420`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar somente persistência e invariantes.
- constraints: sem UI/API pública; sem reutilizar FAQ ou notificações como storage.
