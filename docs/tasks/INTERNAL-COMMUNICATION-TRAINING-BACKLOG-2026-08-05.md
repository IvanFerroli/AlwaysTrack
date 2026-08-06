# Backlog de Comunicação Interna e Aprendizagem - 2026-08-05

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/INTERNAL-COMMUNICATION-TRAINING-BACKLOG-2026-08-05.md

## Objetivo
Planejar duas frentes distintas do AlwaysTrack: um domínio independente de comunicação interna e um domínio de treinamento, onboarding e simulados que reutiliza Fluxos de Atendimento como fonte operacional principal sem contaminar atendimento real.

## Estado observado e capacidades reutilizáveis

| Capacidade existente | Reuso planejado | Limite explícito |
| --- | --- | --- |
| `Organization`, `User`, roles e helpers de acesso | identidade, tenant e RBAC das duas frentes | esconder menu nunca substitui filtro tenant-scoped no service |
| `SupportTeam` e `SupportTeamMembership` históricos | conversas por equipe e atribuição de treinamento | não reutilizar `SalesGroup` como equipe SAC |
| `InAppNotification`, badge, leitura, dedupe e target tipado | avisos de mensagem e de treinamento | contagem de chat não deve ser inferida do histórico genérico de notificações |
| `AuditLog` e taxonomias SAC | mutações sensíveis, moderação, publicação e overrides | conteúdo privado não entra em metadata/log por padrão |
| `ServiceFlowVersion`, grafo, nós e transições | estrutura canônica dos cenários de treinamento | `ServiceFlowSession` continua sendo execução operacional |
| pinning de `ServiceFlowSession` em versão e snapshot de nós | referência para imutabilidade de tentativas | tentativas de treinamento usam persistência e métricas próprias |
| Scriptoteca, Wiki, FAQ e Avisos | itens de trilha, referências e material de apoio | o domínio de treinamento orquestra referências; não absorve governança editorial alheia |
| `OperationalAttachment` e storage privado | evolução de anexos/materiais | anexos de chat ficam fora do primeiro MVP |
| FAQ com comentários/reações | padrão de UI e autorização para evolução social | FAQ não é storage de conversa e não deve ser adaptada como chat |
| Avisos com audiência, vigência e ciência | padrão para obrigatoriedade e validade | conclusão de treinamento possui modelo próprio de progresso e resultado |
| testes anti-IDOR, input validation e notification resolver | baseline de segurança e contrato | as novas rotas exigem matriz negativa específica |

## Colisões e não duplicação
1. `AlwaysChat` no repositório é um sistema externo de atendimento e um conector do Companion. O novo domínio será chamado tecnicamente de `InternalCommunication` até decisão explícita de naming.
2. `Mensagens` em CaseFlow compila respostas operacionais via Scriptoteca; não representa conversa entre usuários.
3. O onboarding já documentado em `README`, TypeDoc e `TASK-AT-117`/`119`/`120` é onboarding técnico de mantenedores, não treinamento de produto.
4. FAQ, Avisos e comentários colaborativos não substituem conversas síncronas ou privadas.
5. `ServiceFlowSession` e as métricas de `TASK-AT-136` não receberão tentativas de treinamento; o isolamento é estrutural, não apenas um filtro de UI.

## Decisões assumidas para taskificação
1. Comunicação interna é um bounded context próprio, sem dependência de CaseFlow ou Fluxos.
2. O MVP de comunicação usa entrega por requisição e atualização incremental/polling limitado; WebSocket/SSE e presença ficam na fase 2.
3. O MVP contempla conversas `GENERAL`, `DIRECT`, `TEAM` e `GROUP`, histórico paginado, envio textual, cursor de leitura e contagem não lida.
4. Notificação in-app é reutilizada, mas o unread do chat possui fonte de verdade própria por participante/conversa.
5. Anexos, respostas encadeadas, reações, edição, exclusão e compartilhamento estruturado de recursos ficam na fase 2; URL textual segura pode existir no MVP.
6. Moderação MVP preserva mensagem e trilha: ocultação/bloqueio é preferida a hard delete.
7. Treinamento assistido e simulado avaliativo usam uma `TrainingAttempt` própria, fixada a uma versão publicada de treinamento e a snapshots/referências imutáveis.
8. Conteúdo de Fluxo, Wiki, Scriptoteca, FAQ, Aviso, vídeo ou material é resolvido e congelado na publicação da versão de treinamento; alterações futuras não reescrevem tentativa, progresso ou resultado.
9. O interpretador/validador puro do grafo de Fluxos pode ser reutilizado, mas handlers, tabelas e analytics de atendimento real não são compartilhados com treinamento.
10. O primeiro ciclo avalia questões objetivas e decisões guiadas com feedback determinístico. Resposta aberta pode ser coletada, mas correção manual/assistida é fase 2.
11. Vídeos e materiais entram inicialmente como links/referências autorizadas; hospedagem, transcodificação e DRM não fazem parte do MVP.
12. Atribuições obrigatórias podem segmentar role, equipe ou usuário e ficam presas à versão publicada atribuída; upgrade para nova versão é explícito.

## Decisões humanas ainda abertas
1. Quem pode criar grupos e canais de equipe e se usuários podem sair de grupos obrigatórios.
2. Política de acesso excepcional ao conteúdo de conversas privadas, retenção, exportação legal e redaction LGPD.
3. Limites de fanout, silêncio, menções e preferências de notificação.
4. Infraestrutura futura de tempo real, semântica e privacidade da presença online.
5. Tipos, tamanho, antivírus e retenção de anexos de chat.
6. Regra padrão de aprovação, número de tentativas, prazo, recertificação e tratamento de versão nova.
7. Responsável e SLA de correção de resposta aberta; uso de IA para avaliação permanece sem decisão.
8. Provedores de vídeo/material e exigência de evidência de consumo.
9. Visibilidade nominal de resultados por supervisor, gestor e admin, inclusive após mudança histórica de equipe.

## Épicos e prioridades

### Épico A — Comunicação interna
- Fundação P0: `TASK-AT-417` a `TASK-AT-419`.
- MVP demonstrável P0/P1: `TASK-AT-420` a `TASK-AT-423`.
- Gate do MVP P1: `TASK-AT-424`.
- Evolução P2: `TASK-AT-425` a `TASK-AT-427`.

### Épico B — Treinamento, onboarding e simulados
- Fundação P0: `TASK-AT-428` a `TASK-AT-430`.
- Autoria e runtimes P0/P1: `TASK-AT-431` a `TASK-AT-433`.
- Jornada, gestão e notificações P1: `TASK-AT-434` a `TASK-AT-436`.
- Gate do MVP P1: `TASK-AT-437`.
- Evolução P2: `TASK-AT-438` e `TASK-AT-439`.

## Ordem recomendada
1. Executar `TASK-AT-417` e `TASK-AT-428` primeiro; podem avançar em paralelo, mas cada uma exige decisão arquitetural aprovada.
2. Materializar as fundações `TASK-AT-418`/`419` e `TASK-AT-429`/`430` antes de criar UI.
3. Fechar o MVP de comunicação em `TASK-AT-420` -> `421` -> `422` -> `423` -> `424`.
4. Fechar o MVP de treinamento em `TASK-AT-431` -> `432` -> `433` -> `434` -> (`435` e `436`) -> `437`.
5. Só priorizar `TASK-AT-425` a `TASK-AT-427` e `TASK-AT-438`/`439` após os gates dos MVPs e decisões humanas correspondentes.

## Caminhos críticos
- Comunicação: `417 -> 418 -> 419 -> 420 -> 421 -> 422 -> 423 -> 424`.
- Treinamento: `428 -> 429 -> 430 -> 431 -> 432 -> 433 -> 434 -> (435 e 436) -> 437`.
- Fase 2: `424 -> (425, 426 e 427)` e `437 -> (438 e 439)`.

## Riscos transversais
1. Confundir comunicação interna com o conector AlwaysChat e criar dependência indevida de atendimento.
2. Reusar sessões de Fluxo para treinamento e contaminar métricas operacionais ou histórico.
3. Resolver referências vivas durante uma tentativa e alterar silenciosamente conteúdo, resposta correta ou nota.
4. Confiar em autorização visual e expor conversa, progresso ou resultado cross-tenant/cross-team.
5. Registrar corpos de mensagem, respostas abertas ou dados pessoais em auditoria, logs ou notificações.
6. Transformar Fluxos em agregado genérico de chat, curso e comunicação.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: iniciar pelos contratos `TASK-AT-417` e `TASK-AT-428`; não antecipar schema ou runtime enquanto decisões bloqueantes não estiverem registradas.
- constraints: sem escopo novo, sem implementação fora da task, sem compartilhar persistência ou métricas entre atendimento e treinamento.
