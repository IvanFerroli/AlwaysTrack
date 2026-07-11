# TASK-AT-304 - Rollout: Fase 3 cobertura consultiva gate

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-304-rollout-phase-3-consultative-coverage-gate.md

## Modo
- mode: audit
- generation-mode: corrective-spec-breakdown

## Capability
Rollout / Gate

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 28 Fase 3

## Objetivo unico
Liberar Fase 3 somente com Yampi, OMIE Filial, OMIE Pharma, Loggi, J&T e Correios/Reversa protegidos por fixtures, health, drift e retry.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-265`, `TASK-AT-267`, `TASK-AT-268`, `TASK-AT-270`, `TASK-AT-272`, `TASK-AT-274`, `TASK-AT-286`, `TASK-AT-287`, `TASK-AT-288`, `TASK-AT-289`, `TASK-AT-293`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-265`, `TASK-AT-267`, `TASK-AT-268`, `TASK-AT-270`, `TASK-AT-272`, `TASK-AT-274`, `TASK-AT-286`, `TASK-AT-287`, `TASK-AT-288`, `TASK-AT-289`, `TASK-AT-293`.

## Alvos explicitos
1. docs/operations/caseflow-rollout-checklist.md
2. docs/operations/connector-live-smoke-checklists.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Validar cada conector com fixture.
2. Exigir health/drift e checklist live manual.
3. Confirmar que Loggi depende de EvidenceFact e nao do Rastreio runtime.

## Acceptance Criteria
1. Todos conectores consultivos tem cobertura explicita.
2. Conector falho nao bloqueia demais.
3. Drift gera degradacao visivel.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secao 28 Fase 3 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Liberar conectores sem drift/health.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-305`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
