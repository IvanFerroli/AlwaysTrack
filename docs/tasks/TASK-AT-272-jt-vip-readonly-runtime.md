# TASK-AT-272 - J&T VIP: runtime read-only

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-272-jt-vip-readonly-runtime.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / J&T VIP

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 20.9

## Objetivo unico
Executar J&T VIP em modo read-only, esperando logout frequente, detectando captcha e pausando para intervencao manual.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-213`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-263`, `TASK-AT-271`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-213`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-263`, `TASK-AT-271`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/jt-vip/
2. services/companion-host/src/orchestrator/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Buscar por tracking, ordem ou ticket quando houver evidencia.
2. Detectar BLOCKED_AUTH e BLOCKED_CAPTCHA.
3. Retomar apos intervencao sem duplicar run.

## Acceptance Criteria
1. Captcha pausa sem bypass.
2. Logout frequente vira intervencao.
3. Retomada preserva resultado parcial.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 20.9 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Tentar contornar captcha.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-273`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
