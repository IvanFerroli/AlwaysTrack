# TASK-AT-243 - CaseFlow Heuristica: golden cases

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-243-heuristic-golden-cases.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
Heuristic Engine / Tests

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 27.1

## Objetivo unico
Criar suite de casos dourados para positivos, negativos, ambiguos, erros de digitacao, negacao, multiplos fluxos, riscos e regressao.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-238`, `TASK-AT-239`, `TASK-AT-240`, `TASK-AT-241`, `TASK-AT-242`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-238`, `TASK-AT-239`, `TASK-AT-240`, `TASK-AT-241`, `TASK-AT-242`.

## Alvos explicitos
1. services/api/src/core/case-flow/heuristics/golden-cases.test.ts
2. tests/fixtures/caseflow/golden-cases/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Cobrir posicao de pedido, entrega nao reconhecida, dinheiro, saude e fraude.
2. Cobrir texto com negacao e erros comuns.
3. Registrar divergencias como feedback de regra.

## Acceptance Criteria
1. Golden cases protegem fluxo principal e hard gates.
2. Casos ambiguos preservam candidatos.
3. Regressao falha se risco critico nao virar gate.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 27.1 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Poucos casos dourados gerarem falsa seguranca.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-244`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
