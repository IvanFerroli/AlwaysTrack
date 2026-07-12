# TASK-AT-247 - CaseFlowPlan: compilador de multiplos fluxos

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-247-caseflow-plan-compiler.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Plan / Compiler

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 16

## Objetivo unico
Construir CaseFlowPlan com fluxo primario, secundarios, gates de risco, passos deduplicados, ramos desconhecidos, dependencias e acoes proibidas.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-240`, `TASK-AT-241`, `TASK-AT-245`, `TASK-AT-246`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-240`, `TASK-AT-241`, `TASK-AT-245`, `TASK-AT-246`.

## Alvos explicitos
1. services/api/src/core/case-flow/plan-compiler.ts
2. services/api/src/core/case-flow/plan-compiler.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Aplicar regras de composicao da secao 16.1.
2. Deduplicar evidencias e passos identicos.
3. Bloquear mensagens conflitantes e acoes financeiras.

## Acceptance Criteria
1. Plano nao retorna apenas fluxo X.
2. Mapa de possibilidades, mensagens, dependencias e proibicoes aparecem no resultado.
3. Fluxo de saude pode interromper comercial.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 16 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Plano composto gerar acoes conflitantes.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-248`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
