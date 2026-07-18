# TASK-AT-364 - RBAC, tenancy e auditoria dos dominios SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-364-sac-rbac-tenancy-audit-taxonomy.md

## Modo
- mode: implementation

## Objetivo unico
Materializar permissoes granulares, escopos de time e eventos de auditoria para Pausas, Performance e Campanhas SAC.

## Contexto minimo
A matriz compartilhada atual cobre Vendas e conhecimento, mas nao distingue operacao propria, supervisao de time, aprovacao, override e administracao SAC.

## Dependencias
- satisfeitas: TASK-AT-362 e TASK-AT-363.
- em aberto: n/a.

## Alvos explicitos
1. Matriz canonica em Shared e documentacao de seguranca.
2. Helpers de escopo organization/team/self na API.
3. Taxonomia e redaction de eventos de auditoria SAC.

## Fora de escopo
- RBAC configuravel por tenant.
- Conceder auditoria global a SAC ou SUPERVISOR.

## Checklist
1. Definir permissoes de ler proprio/time, escolher, trocar, configurar, lancar, aprovar, sobrescrever e gerir campanha.
2. Mapear SAC, SUPERVISOR, GESTOR e ADMIN pelo menor privilegio.
3. Garantir maker-checker para Performance e motivo obrigatorio para override.
4. Aplicar escopo no backend e refletir a mesma matriz na Web.
5. Padronizar eventos com ator, tenant, alvo, antes/depois redigidos e requestId.

## Acceptance Criteria
1. SAC opera apenas os proprios slots e dados publicados permitidos.
2. SUPERVISOR fica limitado aos memberships historicos/vigentes do seu time.
3. GESTOR e ADMIN executam governanca prevista sem bypass de tenant.
4. Toda mutacao sensivel possui evento auditavel sem valor pessoal desnecessario.

## Validacao
- comandos/checks: testes positivos/negativos de access policy, typecheck Shared/API/Web e `git diff --check`.
- revisao manual: matriz role x endpoint x acao x escopo.

## Riscos
- Proteger menu e esquecer filtro no service ou exportacao.

## Proximo passo provavel
TASK-AT-365

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nenhuma rota SAC nova entra sem usar a matriz canonica.
