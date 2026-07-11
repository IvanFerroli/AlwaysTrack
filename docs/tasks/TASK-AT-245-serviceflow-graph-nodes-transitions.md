# TASK-AT-245 - ServiceFlow: grafo, nos e transicoes

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-245-serviceflow-graph-nodes-transitions.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
ServiceFlow / Graph

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 8.1 e 17.1 a 17.4

## Objetivo unico
Adicionar ServiceFlowNode, ServiceFlowTransition e tipos de no START a END, com adaptador de compatibilidade para etapas lineares atuais.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-244`, `TASK-AT-199`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-244`, `TASK-AT-199`.

## Alvos explicitos
1. services/api/src/core/service-flows/
2. packages/shared/src/case-flow/flow.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Modelar FlowNodeDefinition e FlowTransitionDefinition.
2. Suportar requiredFacts, scripts, allowed/forbidden capabilities e riskLevel.
3. Manter renderizacao linear quando fluxo antigo nao tiver grafo.

## Acceptance Criteria
1. Fluxo interno pode ser grafo.
2. UI ainda pode exibir sequencia.
3. Capabilities por no alimentam firewall futuro.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 8.1 e 17.1 a 17.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Exigir que operador interprete grafo.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-246`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
