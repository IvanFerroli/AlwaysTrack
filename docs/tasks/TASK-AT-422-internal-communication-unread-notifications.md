# TASK-AT-422 - Unread, notificações e deep links da Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-422-internal-communication-unread-notifications.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Notifications

## Origem documental
- `TASK-AT-397`, `TASK-AT-398` e `TASK-AT-420`.

## Problema
O chat precisa sinalizar mensagens novas sem usar o centro genérico como fonte de verdade nem gerar uma notificação permanente para cada mensagem. Deep links também precisam revalidar membership atual.

## Objetivo único
Integrar unread próprio do chat ao shell e emitir notificações in-app deduplicadas com alvo tipado e resolução autorizada.

## Contexto mínimo
`InAppNotification` já resolve targets autorizados, mas não substitui o read state de conversa e não deve receber um item permanente por mensagem.

## Inputs
- Read states e endpoints das `TASK-AT-419`/`420`.
- Notification target catalog/resolver e sino Web existentes.
- Política de fanout/anti-ruído do contrato.

## Escopo
1. Badge agregado de conversas não lidas derivado dos read states.
2. Target tipado `INTERNAL_CONVERSATION` com fallback seguro.
3. Notificação deduplicada por conversa/destinatário, atualizável com nova atividade.
4. Resolver backend valida tenant, destinatário, membership e estado da conversa.
5. Regras mínimas para não notificar o autor nem conversa aberta/lida.

## Fora de escopo
- Email, push móvel, menções e preferências avançadas.
- Usar notificações para reconstruir unread.
- Fanout de canais muito grandes sem limite aprovado.

## Arquivos ou domínios candidatos
- `packages/shared/src/notifications/targets.ts`.
- `services/api/src/core/notifications/`.
- `services/api/src/core/` — módulo futuro de Comunicação.
- `apps/web/src/components/notification-center.tsx`.
- `apps/web/src/notification-navigation.ts`.

## Requisitos funcionais
1. Unread do chat muda por mensagem/read cursor mesmo se a notificação for apagada ou lida.
2. A notificação abre a conversa e mensagem contextual quando ainda acessível.
3. Membership removido leva a fallback neutro, sem preview.
4. Dedupe evita uma pilha de notificações da mesma conversa.

## Requisitos de permissão, tenant e auditoria
1. Resolver revalida permissão no clique, não confia no href persistido.
2. Título/body de notificação não expõem conteúdo sensível de direct por padrão.
3. Falhas cross-tenant, removidas e proibidas são indistinguíveis.
4. Telemetria registra tipo/status, nunca corpo da mensagem.

## Checklist de execução
1. Implementar unread agregado próprio.
2. Estender target catalog/resolver.
3. Integrar emitter/dedupe e anti-ruído.
4. Integrar badges/navegação/fallback.
5. Cobrir membership revogado e fanout.

## Critérios de aceite
1. Badge do chat e badge do sino não se confundem e permanecem consistentes.
2. Nova mensagem de outro usuário cria/atualiza uma notificação deduplicada.
3. Abrir pelo sino resolve alvo autorizado e avança leitura somente após exibição.
4. Conversa inacessível não vaza nome, membros ou preview.

## Testes esperados
- Target catalog, resolver e notification service.
- Dedupe, autor, conversa aberta, membership removido e cross-tenant.
- Web navigation, badges independentes e fallback.
- Typecheck Shared/API/Web e `git diff --check`.

## Riscos
- Duplicar contadores e criar estados divergentes.
- Fanout síncrono degradar envio em canal geral.

## Dependências
- satisfeitas: infraestrutura de notificações tipadas existente.
- em aberto: `TASK-AT-420` e `TASK-AT-421`; decisão de limites de fanout.

## Blockers possíveis
- Limite/fanout de canal geral não aprovado.
- Resolver não conseguir revalidar membership atual.

## Definição de pronto
1. Target, resolver, dedupe e badges integrados.
2. Suite negativa comprova revalidação de acesso.
3. Runbook registra limites e fallback do MVP.

## Evidência esperada
- Matriz evento -> notificação -> target -> fallback.
- Resultados de testes de dedupe e acesso.

## Próximo passo provável
`TASK-AT-423`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: integrar notificações sem torná-las fonte de verdade do chat.
- constraints: sem canal externo e sem conteúdo privado em telemetria.
