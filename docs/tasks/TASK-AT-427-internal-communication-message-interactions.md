# TASK-AT-427 - Respostas, reações, edição e exclusão lógica de mensagens

## Metadata
- status: proposed-phase-2
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-427-internal-communication-message-interactions.md

## Modo
- mode: implementation
- priority: P2
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Message Interactions

## Origem documental
- Evolução prevista no contrato `TASK-AT-417` após estabilização do MVP.

## Problema
Replies, reações e correções melhoram contexto, mas alteram ordenação, unread, histórico e auditoria. Exclusão física ou edição sem revisão destruiria evidência.

## Objetivo único
Adicionar interações auditáveis e reversíveis sobre mensagens preservando a sequência e o conteúdo histórico necessário.

## Contexto mínimo
As features são pós-MVP porque alteram lifecycle, unread, notification e retenção; não devem entrar como campos opcionais sem contrato.

## Inputs
- MVP/moderação das `TASK-AT-423`/`424`.
- Decisões humanas de janela, revisão, retenção e anti-ruído.
- Padrão de reações da FAQ apenas como referência.

## Escopo
1. Reply de um nível com referência estável e fallback para origem indisponível.
2. Reações idempotentes por usuário/tipo.
3. Edição do próprio texto dentro de janela configurada, com revision history restrito.
4. Exclusão lógica do próprio texto e moderação separada.
5. Regras de unread e notificação para replies/reactions sem ruído excessivo.

## Fora de escopo
- Threads arbitrariamente aninhadas.
- Hard delete e edição de mensagem de terceiro fora da moderação.
- Emoji/custom reaction administrável no primeiro slice.

## Arquivos ou domínios candidatos
- `services/api/prisma/schema.prisma` e migration aditiva.
- `services/api/src/core/` — módulo futuro de Comunicação.
- `apps/web/src/views/` — integração futura na view de Comunicação.
- Reuso visual controlado dos padrões de `FaqReaction`.

## Requisitos funcionais
1. Reply não duplica a mensagem original e mantém contexto mínimo.
2. Toggle de reação é idempotente e concorrente.
3. Edição cria revisão; UI mostra estado editado.
4. Exclusão lógica preserva posição e reply references com placeholder.

## Requisitos de permissão, tenant e auditoria
1. Somente autor edita/exclui dentro da policy; moderador usa fluxo da `TASK-AT-423`.
2. Toda referência, reação e revisão pertence à mesma conversa/tenant.
3. Auditoria registra ação e IDs; revision content usa storage restrito, não metadata genérica.
4. Histórico de edição não fica disponível a participantes sem decisão de produto aprovada.

## Checklist de execução
1. Definir lifecycle e migration aditiva.
2. Implementar reply/reaction idempotentes.
3. Implementar edição/revisão e exclusão lógica.
4. Integrar UI/unread/notifications.
5. Cobrir concorrência, retenção e autorização.

## Critérios de aceite
1. Reply, reação, edição e exclusão lógica preservam histórico e autorização.
2. Reação duplicada ou retry não cria múltiplos registros.
3. Mensagem removida não quebra paginação, unread ou replies.
4. UI e API distinguem ação do autor e moderação.

## Testes esperados
- Concorrência/idempotência de reações e edições.
- Janela expirada, autor diferente, cross-tenant e reply cross-conversation.
- Web/E2E para placeholders, estado editado, teclado e mobile.
- Migration, typecheck e `git diff --check`.

## Riscos
- Revisões ampliarem retenção de conteúdo sensível.
- Reações/edits gerarem notificações ruidosas ou unread incorreto.

## Dependências
- satisfeitas: padrão de reações da FAQ como referência, sem reutilizar seu storage.
- em aberto: `TASK-AT-423`/`424`; decisões humanas sobre janela de edição, retenção e notificações.

## Blockers possíveis
- Janela/visibilidade de revisão não aprovadas.
- Requisito de hard delete incompatível com retenção/auditoria.

## Definição de pronto
1. Cada interação possui lifecycle, autorização e auditoria definidos.
2. Suite concorrente/negativa cobre invariantes.
3. Hard delete permanece inexistente no fluxo normal.

## Evidência esperada
- Matriz de estados e histórico de revisão sanitizado.
- Resultados de concorrência e anti-IDOR.

## Próximo passo provável
Follow-up somente após uso real do MVP e priorização de produto.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar as interações como slice pós-MVP governado.
- constraints: sem threads profundas e sem hard delete.
