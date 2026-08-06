# TASK-AT-423 - Moderação, retenção e auditoria da Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-423-internal-communication-moderation-retention-audit.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Governance

## Origem documental
- `TASK-AT-417`, `TASK-AT-418` e baseline de LGPD/auditoria.

## Problema
Mensagens internas podem exigir denúncia, contenção e investigação, mas hard delete ou leitura administrativa irrestrita destruiria evidência, privacidade e confiança.

## Objetivo único
Entregar controles mínimos e auditáveis de denúncia, ocultação, bloqueio de conversa e retenção sem apagar histórico silenciosamente.

## Contexto mínimo
O MVP precisa conter abuso e preservar evidência, mas políticas legais de acesso/retention não podem ser inventadas pela implementação.

## Inputs
- Contrato/RBAC das `TASK-AT-417`/`418`.
- Persistência/API das `TASK-AT-419`/`420`.
- Baseline de LGPD, AuditLog e redaction.

## Escopo
1. Usuário denuncia mensagem com categoria e justificativa limitada.
2. Moderador autorizado oculta/restaura mensagem e bloqueia/desbloqueia grupo/canal.
3. Mensagem ocultada preserva autor, sequência e evidência; UI mostra placeholder neutro.
4. Auditoria registra ator, alvo, motivo, antes/depois redigidos e requestId.
5. Documentar retenção, legal hold e export/redaction como política configurável futura.

## Fora de escopo
- Hard delete de mensagens.
- Leitura massiva de directs por Admin/Gestor.
- Moderação automatizada por IA.
- Implementar direitos LGPD sem política aprovada.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — módulo futuro de moderação da Comunicação.
- `services/api/src/core/audit/`.
- `apps/web/src/views/` — view futura de Comunicação.
- `docs/security/` — política futura de moderação/retenção.

## Requisitos funcionais
1. Denúncia idempotente não altera a mensagem automaticamente.
2. Ocultação exige motivo e não muda unread/ordenação retroativamente.
3. Conversa bloqueada permite histórico conforme policy, mas rejeita novo envio.
4. Restauração exige nova ação auditada.

## Requisitos de permissão, tenant e auditoria
1. Usuário denuncia somente mensagem visível em sua conversa.
2. Moderador atua apenas no tenant/escopo permitido pela `TASK-AT-418`.
3. Conteúdo completo não é copiado para `AuditLog`; evidência sensível usa acesso restrito definido no contrato.
4. Acesso excepcional a direct permanece bloqueado até decisão humana documentada.

## Checklist de execução
1. Definir estados e transições de denúncia/moderação.
2. Implementar service/handlers e placeholders Web.
3. Aplicar motivo obrigatório e redaction.
4. Documentar retention/legal hold/export em aberto.
5. Cobrir autorização, idempotência e reversão.

## Critérios de aceite
1. Denunciar, ocultar, restaurar e bloquear produzem estado observável e trilha imutável.
2. Usuário comum não identifica moderador não autorizado nem acessa motivo restrito.
3. Nenhum fluxo de moderação executa hard delete.
4. Política documental distingue auditoria de metadata e acesso ao conteúdo.

## Testes esperados
- Permissões positivas/negativas, cross-tenant e mensagem inacessível.
- Idempotência de denúncia, transições de estado e bloqueio de envio.
- Web para placeholder, motivo obrigatório e acessibilidade do diálogo.
- Audit redaction tests e `git diff --check`.

## Riscos
- Moderador obter acesso mais amplo do que a política autoriza.
- Conteúdo sensível vazar em audit metadata, erro ou notificação.

## Dependências
- satisfeitas: `AuditLog`, redaction e baseline LGPD existentes.
- em aberto: `TASK-AT-418`/`419`/`420`; política humana de retenção e acesso excepcional.

## Blockers possíveis
- Política legal/privacidade exigir acesso não definido.
- Solicitação de hard delete sem lifecycle aprovado.

## Definição de pronto
1. Fluxos mínimos de moderação funcionam com estado reversível.
2. Eventos e redaction possuem testes objetivos.
3. Decisões legais não resolvidas ficam como blocker explícito, não como default permissivo.

## Evidência esperada
- Taxonomia de eventos e exemplos sanitizados.
- Matriz de transições e autorização.

## Próximo passo provável
`TASK-AT-424`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar governança mínima sem expandir acesso a directs.
- constraints: sem hard delete e sem conteúdo em logs genéricos.
