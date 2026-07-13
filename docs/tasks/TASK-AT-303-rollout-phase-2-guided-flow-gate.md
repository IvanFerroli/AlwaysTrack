# TASK-AT-303 - Rollout: Fase 2 fluxo guiado gate

## Metadata
- status: audit-complete-no-go
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-303-rollout-phase-2-guided-flow-gate.md

## Modo
- mode: audit
- generation-mode: corrective-spec-breakdown

## Capability
Rollout / Gate

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 28 Fase 2

## Objetivo unico
Liberar Fase 2 somente com heuristica, ServiceFlow evoluido, stepper, Scriptoteca, copy, testes de fluxo/mensagem e estabilidade incremental.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-243`, `TASK-AT-246`, `TASK-AT-248`, `TASK-AT-252`, `TASK-AT-253`, `TASK-AT-259`, `TASK-AT-262`, `TASK-AT-291`, `TASK-AT-293`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-243`, `TASK-AT-246`, `TASK-AT-248`, `TASK-AT-252`, `TASK-AT-253`, `TASK-AT-259`, `TASK-AT-262`, `TASK-AT-291`, `TASK-AT-293`.

## Alvos explicitos
1. docs/operations/caseflow-rollout-checklist.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Checar grafo, version pinning e stepper.
2. Checar mensagens sem undefined/dado cruzado.
3. Checar que copy nao e escrita externa.

## Acceptance Criteria
1. Fluxo guiado funciona sem IA.
2. Plano incremental nao pula UI.
3. Nenhuma escrita/draft esta liberada.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secao 28 Fase 2 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Confundir copy com draft ou envio.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-304`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
