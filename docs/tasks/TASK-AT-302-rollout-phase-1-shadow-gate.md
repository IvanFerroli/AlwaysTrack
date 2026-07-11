# TASK-AT-302 - Rollout: Fase 1 shadow mode gate

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-302-rollout-phase-1-shadow-gate.md

## Modo
- mode: audit
- generation-mode: corrective-spec-breakdown

## Capability
Rollout / Gate

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 28 Fase 1

## Objetivo unico
Liberar Fase 1 somente com AlwaysChat intake, Rastreio, evidencias, resumo, protocolo seguro, anti dado cruzado, SLO inicial e recuperacao basica.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-236`, `TASK-AT-237`, `TASK-AT-283`, `TASK-AT-284`, `TASK-AT-291`, `TASK-AT-293`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-236`, `TASK-AT-237`, `TASK-AT-283`, `TASK-AT-284`, `TASK-AT-291`, `TASK-AT-293`.

## Alvos explicitos
1. docs/operations/caseflow-rollout-checklist.md
2. docs/demo/caseflow-guided-demo.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Verificar sem mensagens externas.
2. Checar protocolo local seguro e reidratacao.
3. Registrar riscos residuais.

## Acceptance Criteria
1. Fase 1 nao libera escrita.
2. Gate falha se anti dado cruzado ou recuperacao basica falhar.
3. Comparacao manual esta ativa.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secao 28 Fase 1 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Liberar shadow mode sem seguranca local.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-303`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
