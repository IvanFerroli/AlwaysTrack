# TASK-AT-436 - Notificações, deep links e lembretes de Treinamento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-436-training-notifications-deep-links-reminders.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
Training / Notifications

## Origem documental
- `TASK-AT-397`, `TASK-AT-398`, `TASK-AT-433` a `TASK-AT-435`.

## Problema
Atribuições obrigatórias e prazos precisam chegar ao usuário/responsável, mas notificações sem target autorizado, dedupe e política de lembrete gerariam link quebrado, vazamento ou ruído.

## Objetivo único
Integrar eventos de Treinamento ao centro in-app com targets tipados, resolução autorizada e lembretes idempotentes.

## Contexto mínimo
O sino existente permanece a única superfície de histórico de notificações; a página de Treinamentos exibe status/progresso, não duplica o centro.

## Inputs
- Catálogo/resolver de notification targets.
- Assignments, enrollments, attempts e reporting das tasks anteriores.
- Política de prazo/lembrete aprovada.

## Escopo
1. Targets `TRAINING_ENROLLMENT`, `TRAINING_ATTEMPT` e fallback `TRAINING_CATALOG`.
2. Eventos assignment, due soon, overdue, approved, failed, review pending/complete e versão substituída quando aplicável.
3. Dedupe por evento/versão/destinatário.
4. Resolver revalida tenant, recipient, ownership/team scope e estado.
5. Job/manual materializer idempotente de lembretes com timezone.

## Fora de escopo
- Email, WhatsApp, push e preferências avançadas.
- Notificar cada resposta/step.
- Expor score/resposta sensível no corpo da notificação.

## Arquivos ou domínios candidatos
- `packages/shared/src/notifications/targets.ts`.
- `services/api/src/core/notifications/notification-target-resolver.ts`.
- `services/api/src/core/` — emissores futuros de Treinamento.
- `apps/web/src/notification-navigation.ts`.
- `services/api/src/jobs/` — job futuro de lembretes.

## Requisitos funcionais
1. Assignment gera uma notificação acionável por destinatário.
2. Lembrete não se repete dentro da mesma janela/idempotency key.
3. Clique abre enrollment/attempt atual ou fallback com mensagem segura.
4. Estado concluído/arquivado não leva a tela quebrada.
5. Responsável recebe somente agregados/eventos autorizados.

## Requisitos de permissão, tenant e auditoria
1. Resolver valida recipient e acesso atual antes de retornar rota.
2. Cross-tenant, ausente e sem permissão são indistinguíveis.
3. Notificação contém título/contexto mínimo; sem resposta, gabarito ou score detalhado.
4. Job registra contagens/tipos, não audiência nominal em log aberto.

## Checklist de execução
1. Estender catálogo/aliases/params e resolver.
2. Integrar emissores e dedupe.
3. Implementar lembretes timezone-aware.
4. Integrar navegação/fallback Web.
5. Cobrir estados revogados/arquivados e roles.

## Critérios de aceite
1. Cada evento MVP possui target/fallback e dedupe determinístico.
2. Entidade inacessível não vaza título, user ou score.
3. Lembretes respeitam prazo/timezone e não geram avalanche.
4. Centro existente continua sendo a superfície canônica.

## Testes esperados
- Catálogo, resolver, dedupe, timezone/DST e idempotência de job.
- Owner/team manager/cross-team/cross-tenant e entidade arquivada.
- Web navigation/fallback e mark-read.
- Typecheck Shared/API/Web, job tests e `git diff --check`.

## Riscos
- Lembretes ruidosos reduzirem confiança no sino.
- Target revelar resultado nominal para destinatário errado.

## Dependências
- satisfeitas: notification targets/resolver e jobs idempotentes existentes.
- em aberto: `TASK-AT-433` a `TASK-AT-435`; política de lembretes.

## Blockers possíveis
- Regras de prazo/timezone não definidas.
- Canais externos solicitados sem nova task/política.

## Definição de pronto
1. Targets, resolver, emissores, job e navegação integrados.
2. Testes de autorização/idempotência/timezone verdes.
3. Matriz de eventos e política anti-ruído documentadas.

## Evidência esperada
- Matriz evento -> público -> dedupe -> target -> fallback.
- Execução repetida do job sem duplicatas.

## Próximo passo provável
`TASK-AT-437`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: reutilizar o sino e resolver tipado existentes.
- constraints: sem canal externo e sem dados sensíveis no payload.
