# TASK-AT-417 - Contrato do domínio de Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-417-internal-communication-domain-contract.md

## Modo
- mode: planning
- priority: P0
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Architecture

## Origem documental
- Solicitação de expansão do AlwaysTrack em 2026-08-05.
- `docs/tasks/INTERNAL-COMMUNICATION-TRAINING-BACKLOG-2026-08-05.md`.

## Problema
O produto possui Avisos, FAQ, notificações e um conector externo chamado AlwaysChat, mas não possui um bounded context para conversas internas. Implementar sem contrato criaria colisão de naming, duplicação de funcionalidades e risco de acoplamento com Fluxos/CaseFlow.

## Objetivo único
Formalizar a fronteira, os invariantes, o vocabulário e o recorte MVP do domínio independente de Comunicação Interna antes de persistência ou runtime.

## Contexto mínimo
O contrato deve ser aditivo ao produto SAC atual e impedir que chat seja implementado como extensão de AlwaysChat, FAQ, Avisos ou Fluxos.

## Inputs
- Inventário de schema, services, Web, ADRs e backlog existente.
- Decisões arquiteturais fornecidas pelo usuário.
- Matriz de questões abertas deste backlog.

## Escopo
1. Definir `InternalCommunication` e os tipos `GENERAL`, `DIRECT`, `TEAM` e `GROUP`.
2. Definir ownership, membership, lifecycle, ordenação, idempotência, leitura e unread.
3. Separar mensagem, notificação, auditoria e compartilhamento de recurso.
4. Registrar capacidades do MVP e da fase 2.
5. Registrar decisões bloqueantes de privacidade, retenção e moderação.

## Fora de escopo
- Alterar schema, API ou Web.
- Renomear ou modificar o conector AlwaysChat.
- Definir comunicação externa com clientes.

## Arquivos ou domínios candidatos
- `docs/adr/` — ADR futuro da fronteira de Comunicação.
- `docs/specs/` — spec futura do MVP de Comunicação.
- `docs/architecture/domains.md`.
- Domínios existentes: Auth, SupportTeam, Notifications e Audit.

## Requisitos funcionais
1. Uma organização possui um canal geral canônico.
2. Conversas diretas são únicas por conjunto normalizado de participantes no MVP.
3. Canais de equipe referenciam `SupportTeam`; grupos mantêm membership próprio.
4. Histórico usa cursor estável e unread usa estado de leitura próprio.
5. Conteúdo textual pode conter URL segura, sem vínculo técnico obrigatório com outros domínios.

## Requisitos de permissão, tenant e auditoria
1. Toda entidade contém `organizationId` e nunca aceita tenant do cliente como autoridade.
2. Membership e escopo de equipe são validados no backend.
3. Auditoria guarda mutações sensíveis e metadata mínima; corpo de mensagem fica fora por padrão.
4. Acesso excepcional a conversa privada exige decisão humana explícita e justificativa auditável.

## Checklist de execução
1. Mapear fronteiras e colisões existentes.
2. Definir agregados, estados, invariantes e ownership.
3. Separar MVP e fase 2.
4. Registrar privacidade, retenção e moderação em aberto.
5. Publicar ADR/spec e atualizar mapa de domínios.

## Critérios de aceite
1. ADR/spec distinguem Comunicação Interna, AlwaysChat, Avisos, FAQ e mensagens CaseFlow.
2. Cada agregado possui fonte de verdade, owner, chave tenant e política de histórico.
3. MVP e fase 2 estão separados sem requisito implícito de tempo real.
4. Nenhuma decisão de privacidade em aberto é silenciosamente fechada.

## Testes esperados
- `npm run check:docs`.
- `git diff --check`.
- Revisão manual contra schema, rotas, notificações, equipes e tasks existentes.

## Riscos
- Naming ambíguo reintroduzir dependência com AlwaysChat.
- Um contrato amplo demais transformar chat em plataforma social completa.

## Dependências
- satisfeitas: inventário do backlog e domínios existentes; decisão do usuário de manter Comunicação separada de Fluxos.
- em aberto: política humana de privacidade/moderação de conversas privadas.

## Blockers possíveis
- Política de acesso excepcional a DMs não definida.
- Tentativa de usar AlwaysChat, FAQ ou Avisos como storage de conversa.

## Definição de pronto
1. ADR e spec aceitos, com decisões, perguntas abertas e diagrama de fronteiras.
2. Matriz MVP/fase 2 e invariantes citados pelas tasks dependentes.
3. Validação documental verde e handoff sem implementação antecipada.

## Evidência esperada
- Links para ADR/spec e matriz de não duplicação.
- Registro das decisões humanas ainda abertas.

## Próximo passo provável
`TASK-AT-418`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: concluir contrato documental antes de autorizar RBAC ou schema.
- constraints: sem código de produto, sem dependência de Fluxos/CaseFlow.
