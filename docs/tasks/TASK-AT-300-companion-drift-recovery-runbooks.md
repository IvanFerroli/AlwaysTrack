# TASK-AT-300 - Runbooks: Companion, drift e recuperacao

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-300-companion-drift-recovery-runbooks.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
Documentation / Operations

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 28 Fase 5, 36

## Objetivo unico
Criar runbooks de operacao local, drift de conector, recuperacao, live smoke, rollback e troubleshooting.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-287`, `TASK-AT-293`, `TASK-AT-294`, `TASK-AT-295`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-287`, `TASK-AT-293`, `TASK-AT-294`, `TASK-AT-295`.

## Alvos explicitos
1. docs/operations/companion-local-runbook.md
2. docs/operations/connector-drift-runbook.md
3. docs/operations/connector-live-smoke-checklists.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Consolidar prewarm, reconexao, retry, cancelamento e intervencoes.
2. Documentar drift e degradacao.
3. Documentar rollback e backup/restore.

## Acceptance Criteria
1. Operador consegue recuperar ambiente local.
2. Conector quebrado tem caminho de diagnostico.
3. Runbook nao inclui credenciais.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 28 Fase 5, 36 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Runbook virar tutorial sem criterio GO/NO-GO.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-301`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
