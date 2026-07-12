# TASK-AT-248 - CaseFlowPlan: reconciliacao incremental

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-248-caseflow-incremental-plan-reconciliation.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Plan / Reconciliation

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 7.2, 15.8, 16, 21

## Objetivo unico
Recalcular plano quando novas evidencias chegam, comparando plano anterior e novo, preservando passo atual e escolhas humanas quando ainda validos.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-247`, `TASK-AT-225`, `TASK-AT-226`, `TASK-AT-227`, `TASK-AT-228`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-247`, `TASK-AT-225`, `TASK-AT-226`, `TASK-AT-227`, `TASK-AT-228`.

## Alvos explicitos
1. services/api/src/core/case-flow/plan-reconciliation.ts
2. services/api/src/core/case-flow/plan-reconciliation.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Reexecutar heuristica quando fatos/conflitos/overrides mudarem.
2. Invalidar apenas ramos afetados e registrar historico de revisoes do plano.
3. Tratar mensagem ja copiada e fluxo que deixou de ser aplicavel.

## Acceptance Criteria
1. Interface nao pula enquanto usuario le.
2. Mudanca de recomendacao gera aviso claro.
3. Escolhas humanas confirmadas prevalecem.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 7.2, 15.8, 16, 21 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Plano atualizar de forma brusca e atrapalhar atendimento.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-249`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
