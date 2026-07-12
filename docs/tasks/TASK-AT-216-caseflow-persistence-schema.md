# TASK-AT-216 - CaseFlow Core: persistencia inicial

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-216-caseflow-persistence-schema.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / Persistence

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 24.1

## Objetivo unico
Criar modelo persistente versionado para todas as entidades CaseFlow sugeridas pela SPEC, incluindo ServiceCase, ServiceCaseSource, ConnectorRun, EvidenceFact, EvidenceConflict, HeuristicRule, HeuristicRuleVersion, CaseFlowCandidate, CaseFlowPlan, CaseFlowPlanNode, CaseFlowPlanTransition, ServiceFlowVersion, ServiceFlowNode, ServiceFlowTransition, ServiceFlowSessionStep, CompiledMessage, CompanionInstallation, ConnectorDefinition e ConnectorHealthEvent.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-198`, `TASK-AT-200`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-198`, `TASK-AT-200`.

## Alvos explicitos
1. services/api/prisma/schema.prisma
2. services/api/src/core/case-flow/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Adicionar entidades em migration Prisma versionada quando a task for executada.
2. Preservar tenant/organization e user scope.
3. Nao salvar raw HTML por padrao.
4. Criar caminho de rollback/reversal da migration.
5. Rodar `db:test:migrations` ou gate equivalente de migracao.
6. Garantir que `CompanionInstallation` e `ConnectorDefinition` existam antes de `TASK-AT-211`, `TASK-AT-212` e `TASK-AT-283`.

## Acceptance Criteria
1. Schema cobre todas as entidades sugeridas pela SPEC ou documenta explicitamente qualquer adiamento com task sucessora.
2. Fatos normalizados podem ser mantidos sem cookies/senhas.
3. Rollback/reversal da migration tem caminho documentado e testavel.
4. Instalacao local e definicoes de conector existem como base para trust, protocolo e health.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado, `db:test:migrations` ou equivalente quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 24.1 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Persistir dados brutos sensiveis por padrao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-217`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
