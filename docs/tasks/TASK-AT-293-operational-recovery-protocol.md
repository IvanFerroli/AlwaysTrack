# TASK-AT-293 - CaseFlow: recuperacao operacional e reidratacao

## Metadata
- status: implementation-complete-live-recovery-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-293-operational-recovery-protocol.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Operations / Recovery

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 8.4, 12.3, 12.4, 14, 21, 30

## Objetivo unico
Cobrir fechar/reabrir side panel, trocar aba, reiniciar extensao, host, WSL, reconectar protocolo, recuperar caso, ultimo passo, retry, cancelar e retomar login/captcha.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-195`, `TASK-AT-205`, `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-211`, `TASK-AT-214`, `TASK-AT-248`, `TASK-AT-250`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-195`, `TASK-AT-205`, `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-211`, `TASK-AT-214`, `TASK-AT-248`, `TASK-AT-250`.

## Alvos explicitos
1. apps/companion-extension/src/side-panel/recovery/
2. services/companion-host/src/orchestrator/recovery.ts
3. docs/operations/companion-local-runbook.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir reidratacao por caseId/sessionId.
2. Deduplicar runs apos reconexao/retry.
3. Retomar intervencao humana apos login/captcha.

## Acceptance Criteria
1. Caso em andamento e recuperavel.
2. Ultimo passo volta apos reabrir side panel.
3. Restart de host/WSL nao duplica execucao.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 8.4, 12.3, 12.4, 14, 21, 30 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Perder atendimento em troca de aba ou suspensao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-294`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
