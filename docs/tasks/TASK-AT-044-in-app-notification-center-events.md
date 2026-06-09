# TASK-AT-044 - In-app notification center events

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-044-in-app-notification-center-events.md

## Modo
- mode: implementation

## Objetivo unico
Criar um MVP interno/in-app de notificacoes para eventos de notas, Wiki e FAQ, com centro de notificacoes autenticado e estado lido/nao lido por usuario.

## Contexto minimo
O produto precisa notificar usuarios sobre notas aprovadas, rejeitadas, comentadas e revisadas; eventos da Wiki; e eventos da FAQ. O repositorio ainda tem modelos/jobs historicos de notificacao do recorte SyLembra, mas esta task deve ficar no MVP interno/in-app e nao abrir WhatsApp, email ou push externo.

## Inputs
- Pedido do usuario em 2026-06-08.
- `TASK-AT-037-sales-document-approval-workflow.md`
- `TASK-AT-041-wiki-review-decision-comments.md`
- `TASK-AT-042-faq-threads-mvp.md`
- `TASK-AT-043-faq-promote-thread-to-wiki.md`
- `docs/tasks/TASK-AT-027-decommission-sylembra-legacy.md`
- Modelos historicos `NotificationJob`/logs no Prisma, apenas como referencia tecnica.

## Dependencias
- satisfeitas: autenticacao, usuarios/roles, auditoria, eventos de notas e Wiki.
- em aberto: FAQ threads e promocao para Wiki devem existir para cobrir todos os eventos de FAQ; comentario operacional de nota depende de `TASK-AT-037`.

## Alvos explicitos
1. `services/api/prisma/schema.prisma`: modelo de notificacao in-app e leitura por usuario, ou estrutura equivalente.
2. `services/api/src/core/notifications/*`: service/handlers para listar, contar nao lidas, marcar lida/todas lidas.
3. Integracoes pequenas nos services de notas, Wiki e FAQ para emitir eventos internos.
4. `apps/web/src/main.tsx`: indicador/centro de notificacoes no app autenticado.
5. `apps/web/src/styles.css`: estilos pequenos para dropdown/painel de notificacoes.
6. Testes de service para emissao, destinatarios, leitura e isolamento por organizacao.

## Fora de escopo
- WhatsApp, email, SMS, push browser/mobile ou provider externo.
- Reativar jobs legados SyLembra de notificacao.
- Preferencias avancadas por usuario/canal.
- WebSocket ou realtime; polling leve ou refresh manual e suficiente no MVP.
- Notificacoes anonimas/publicas.

## Checklist
1. Definir contrato de `Notification` com organizacao, destinatario, tipo, titulo, corpo curto, entidade alvo, link interno, data e `readAt`.
2. Definir tipos MVP: `sales_document.approved`, `sales_document.rejected`, `sales_document.commented`, `sales_document.reviewed`, `wiki.request.created`, `wiki.request.approved`, `wiki.request.rejected`, `wiki.page.published`, `faq.thread.created`, `faq.thread.commented`, `faq.thread.reacted`, `faq.thread.state_changed`, `faq.thread.promoted_to_wiki`.
3. Implementar emissao idempotente quando uma acao puder ser repetida.
4. Escolher destinatarios minimos por evento, por exemplo autor da nota/thread/proposta, admins/superiores relevantes e usuarios envolvidos.
5. Criar API autenticada para listar notificacoes do usuario atual, contar nao lidas e marcar lida.
6. Criar UI in-app com badge de nao lidas, lista recente, link interno e acao marcar como lida.
7. Garantir que links internos respeitem rotas existentes: notas, `/wiki/<slug>` e FAQ thread.
8. Cobrir isolamento por organizacao e ausencia de notificacao para ator quando essa regra for definida.
9. Documentar claramente que canais externos ficam fora de escopo.

## Acceptance Criteria
1. Usuario autenticado ve um centro de notificacoes in-app com contador de nao lidas.
2. Nota aprovada, rejeitada, comentada ou revisada gera notificacao para destinatarios definidos.
3. Wiki gera notificacoes para proposta criada, aprovada/rejeitada com nota de decisao e pagina publicada.
4. FAQ gera notificacoes para nova thread, comentario/resposta, reacao, mudanca de estado e promocao para Wiki.
5. Cada notificacao tem link interno acionavel quando a entidade ainda existe.
6. Usuario marca notificacao individual ou todas como lidas.
7. Usuario nao ve notificacoes de outra organizacao.
8. Nenhum canal externo e ativado nesta task.

## Definition of Done
1. Modelo/API/UI de notificacoes in-app entregues como MVP.
2. Eventos de notas, Wiki e FAQ emitem notificacoes com destinatarios documentados.
3. Estado lido/nao lido funciona por usuario.
4. Testes cobrem emissao, leitura e tenant.
5. Validacao manual percorre pelo menos um evento de notas, um de Wiki e um de FAQ.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/api`, `npm run test --workspace @alwaystrack/api -- notifications.service.test.ts sales-documents.service.test.ts wiki.service.test.ts faq.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: aprovar/rejeitar nota; aprovar/rejeitar proposta Wiki com nota; criar/comentar/promover thread FAQ; abrir centro de notificacoes; marcar lidas.

## Evidencia esperada
- Print ou relato do centro de notificacoes com eventos recentes.
- Testes mostrando destinatarios e isolamento por organizacao.
- Confirmacao de que nenhum provider externo foi configurado ou acionado.

## Riscos
- Fan-out de notificacoes pode criar duplicidade se eventos forem emitidos dentro de retries.
- Destinatarios mal definidos podem gerar ruido; manter MVP conservador.
- Links internos podem quebrar se slug/FAQ thread route nao estiverem prontos.
- Reuso de modelos legados pode puxar escopo externo; preferir contrato in-app claro.

## Blockers possiveis
- `TASK-AT-042`/`TASK-AT-043` ainda nao implementadas para eventos FAQ completos.
- Ambiguidade sobre quem deve receber cada evento comercial.
- Falta de rota interna para detalhe de nota ou FAQ thread.

## Retorno esperado
- resumo curto do centro de notificacoes entregue
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
