# TASK-AT-305 - Rollout: Fase 4 rascunhos e rollback gate

## Metadata
- status: audit-complete-no-go
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-305-rollout-phase-4-drafts-rollback-gate.md

## Modo
- mode: audit
- generation-mode: corrective-spec-breakdown

## Capability
Rollout / Gate

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 28 Fase 4

## Objetivo unico
Liberar Fase 4 somente apos firewall enforcement, testes negativos, auditoria, rollback, recuperacao e rascunhos AlwaysChat/Lancador sem confirmar.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-280`, `TASK-AT-281`, `TASK-AT-282`, `TASK-AT-293`, `TASK-AT-294`, `TASK-AT-295`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-280`, `TASK-AT-281`, `TASK-AT-282`, `TASK-AT-293`, `TASK-AT-294`, `TASK-AT-295`.

## Alvos explicitos
1. docs/operations/caseflow-rollout-checklist.md
2. docs/operations/companion-update-rollback-runbook.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Verificar INSERT_DRAFT e FILL_FORM.
2. Confirmar ausencia de SEND_MESSAGE/SUBMIT/CREATE_ORDER.
3. Checar rollback de extensao/host/config.

## Acceptance Criteria
1. Primeira escrita so ocorre apos protecoes.
2. Lancador nunca gera pedido.
3. Rollback e recuperacao estao prontos.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secao 28 Fase 4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Liberar draft sem rollback operacional.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-306`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
