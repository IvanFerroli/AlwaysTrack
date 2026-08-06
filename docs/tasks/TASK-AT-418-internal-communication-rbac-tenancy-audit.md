# TASK-AT-418 - RBAC, tenancy e auditoria da Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-418-internal-communication-rbac-tenancy-audit.md

## Modo
- mode: implementation
- priority: P0
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Authorization

## Origem documental
- `TASK-AT-417` e a matriz de permissões existente em Shared/Auth.

## Problema
As roles atuais não distinguem ler, criar grupo, gerir membros, moderar, auditar metadata ou acessar conteúdo privado. Reusar permissões genéricas ou apenas esconder UI permitiria escalada horizontal e vazamento entre equipes/tenants.

## Objetivo único
Materializar uma matriz canônica de menor privilégio e helpers de escopo para todas as operações de Comunicação Interna.

## Contexto mínimo
O produto já possui matrizes comerciais e SAC, mas nenhuma cobre membership de conversa ou moderação de conteúdo privado.

## Inputs
- Contrato aprovado da `TASK-AT-417`.
- Permission matrix Shared e access-policy atuais.
- `SupportTeamMembership` e taxonomias de auditoria existentes.

## Escopo
1. Permissões de listar/criar conversa, enviar/ler mensagem, gerir membros, moderar e consultar auditoria.
2. Escopos `organization`, `team`, `conversation-member` e `self`.
3. Regras para usuário inativo, membership encerrado e remoção de grupo.
4. Taxonomia de eventos e política de redaction.

## Fora de escopo
- RBAC configurável por tenant.
- Criar tabelas ou endpoints de mensagem.
- Conceder leitura administrativa automática de conversas privadas.

## Arquivos ou domínios candidatos
- `packages/shared/src/index.ts` ou novo módulo em `packages/shared/src/`.
- `services/api/src/core/auth/access-policy.ts`.
- `docs/security/` — matriz futura de acesso da Comunicação.
- `services/api/src/core/audit/`.

## Requisitos funcionais
1. Usuário ativo acessa somente conversas das quais participa ou canais gerais permitidos.
2. Equipe usa membership vigente; histórico posterior à saída segue a política do contrato.
3. Gestor de grupo pode administrar membros apenas no escopo autorizado.
4. Moderação é ação separada de leitura cotidiana.

## Requisitos de permissão, tenant e auditoria
1. Checks positivos e negativos usam organização derivada da sessão.
2. Cross-tenant e sem membership retornam falha fechada sem oracle de existência.
3. Toda gestão de membro, bloqueio, ocultação e acesso excepcional gera auditoria redigida.
4. Body, anexo e texto de mensagem não aparecem em logs de autorização.

## Checklist de execução
1. Definir permissions e escopos por tipo de conversa.
2. Implementar helpers Shared/API e capabilities Web.
3. Definir membership atual/histórico e usuário inativo.
4. Padronizar eventos/redaction.
5. Cobrir matriz positiva e negativa.

## Critérios de aceite
1. Existe matriz role x ação x escopo para todos os tipos de conversa.
2. Backend possui helper único consumível pelos services futuros.
3. Gestor/Admin não ganha leitura privada por inferência.
4. Web consegue derivar capacidades sem inventar regra paralela.

## Testes esperados
- Testes unitários da matriz para ADMIN, GESTOR, SUPERVISOR, SAC e demais roles ativas.
- Casos anti-IDOR, membership histórico, usuário inativo e cross-team.
- Typecheck Shared/API/Web e `git diff --check`.

## Riscos
- Confundir poder de moderação com acesso irrestrito ao conteúdo.
- Divergência entre membership da conversa e membership da equipe.

## Dependências
- satisfeitas: matrizes de `TASK-AT-154`, `TASK-AT-364` e helpers atuais.
- em aberto: `TASK-AT-417` aceito e decisão sobre acesso excepcional a DMs.

## Blockers possíveis
- Matriz de moderação de DMs não aprovada.
- Roles do canal geral/equipe não definidas no contrato.

## Definição de pronto
1. Matriz, helpers, taxonomia e documentação entregues.
2. Suite negativa demonstra isolamento tenant/team/member.
3. Nenhum endpoint futuro precisa codificar roles ad hoc.

## Evidência esperada
- Matriz versionada e relatório de testes positivos/negativos.
- Lista de metadata permitida por evento.

## Próximo passo provável
`TASK-AT-419`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: consolidar autorização antes da migration.
- constraints: sem UI como controle de segurança; sem leitura privada implícita.
