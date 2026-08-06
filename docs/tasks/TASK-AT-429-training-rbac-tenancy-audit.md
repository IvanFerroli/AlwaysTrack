# TASK-AT-429 - RBAC, tenancy e auditoria de Treinamento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-429-training-rbac-tenancy-audit.md

## Modo
- mode: implementation
- priority: P0
- generation-mode: initiative-breakdown

## Capability
Training / Authorization

## Origem documental
- `TASK-AT-428`, `TASK-AT-154`, `TASK-AT-363` e `TASK-AT-364`.

## Problema
As permissões atuais não distinguem participar, gerir conteúdo, atribuir, revisar resposta, consultar próprio resultado, consultar equipe ou aplicar override. Relatórios nominais sem escopo podem virar vigilância ou vazamento cross-team.

## Objetivo único
Materializar matriz de menor privilégio, escopo temporal de equipe e taxonomia auditável para o domínio de Treinamento.

## Contexto mínimo
`SUPERVISOR` e `GESTOR` têm capacidades distintas no produto atual; não é seguro assumir que roles gerenciais comerciais equivalem a responsáveis pedagógicos.

## Inputs
- Matriz de roles/permissões Shared.
- `SupportTeamMembership(validFrom, validTo)`.
- Política de resultados e responsáveis aprovada em `TASK-AT-428`.

## Escopo
1. Permissões `take`, `readSelf`, `manage`, `publish`, `assign`, `readTeam`, `readOrg`, `reviewOpenAnswer` e `override`.
2. Escopos self, equipe vigente/histórica e organização.
3. Regras maker-checker para override/revisão quando aplicável.
4. Taxonomia/redaction de criação, publicação, atribuição, tentativa, nota, reset e revisão.

## Fora de escopo
- RBAC configurável por tenant.
- Ranking nominal de colaboradores.
- Definir responsáveis sem decisão humana.

## Arquivos ou domínios candidatos
- `packages/shared/src/` — módulo futuro de permissões de Treinamento.
- `services/api/src/core/auth/access-policy.ts`.
- `services/api/src/core/` — módulo futuro de Treinamento.
- `docs/security/` — matriz futura de acesso de Treinamento.

## Requisitos funcionais
1. Usuário vê e executa somente treinamentos publicados/atribuídos permitidos.
2. Responsável consulta equipe conforme janela histórica relevante da atribuição/tentativa.
3. Gestor de conteúdo não recebe automaticamente acesso a respostas livres.
4. Reset/override exige motivo e preserva resultado anterior.

## Requisitos de permissão, tenant e auditoria
1. Tenant vem da sessão em toda query/mutação.
2. Team/user/role target precisa pertencer à organização.
3. Cross-tenant e sem escopo falham sem oracle de existência.
4. Logs guardam IDs, estados e score agregado; nunca texto de resposta livre.

## Checklist de execução
1. Construir matriz role x ação x escopo.
2. Implementar helpers Shared/API e capabilities Web.
3. Definir resolução de equipe vigente/histórica.
4. Padronizar eventos e redaction.
5. Cobrir matriz positiva e negativa.

## Critérios de aceite
1. Todas as rotas futuras têm permission key e helper de escopo definidos.
2. Responsável não acessa usuário fora do time/período permitido.
3. Autor de conteúdo e avaliador não são confundidos por default.
4. Override/reset/review são auditáveis e não apagam histórico.

## Testes esperados
- Matriz por role, self/team/org e membership temporal.
- Anti-IDOR, usuário inativo, equipe alterada e target cross-tenant.
- Audit redaction para respostas abertas e cenário.
- Typecheck Shared/API/Web e `git diff --check`.

## Riscos
- Acesso gerencial virar ranking/vigilância indevida.
- Membership atual reatribuir retroativamente resultados históricos.

## Dependências
- satisfeitas: times SAC históricos e taxonomia de auditoria existentes.
- em aberto: `TASK-AT-428` aceita; definição humana de responsáveis/visibilidade.

## Blockers possíveis
- Roles responsáveis não definidas pelo produto.
- Política de histórico após mudança de equipe não aprovada.

## Definição de pronto
1. Matriz, helpers, capabilities e taxonomia versionados.
2. Testes negativos cobrem tenant/team/self.
3. Nenhuma rota dependente precisa inferir role ad hoc.

## Evidência esperada
- Matriz role x ação x escopo e relatório de testes.
- Catálogo de eventos com metadata permitida.

## Próximo passo provável
`TASK-AT-430`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: fechar acesso antes de migration e handlers.
- constraints: sem ranking nominal e sem resposta livre em logs.
