# TASK-AT-240 - CaseFlow Heuristica: scoring, hard rules e candidatos

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-240-heuristic-scoring-hard-rules.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Heuristic Engine / Scoring

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 15.5 a 15.8

## Objetivo unico
Pontuar fluxos, aplicar hard rules de risco e retornar FlowCandidates com razoes, fatos de suporte e fatos faltantes.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-239`, `TASK-AT-219`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-239`, `TASK-AT-219`.

## Alvos explicitos
1. services/api/src/core/case-flow/heuristics/engine.ts
2. services/api/src/core/case-flow/heuristics/engine.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Calcular score e confidence por fluxo.
2. Aplicar gates de dinheiro, saude, juridico, fraude e dados bancarios.
3. Retornar principal, secundarios e risk gates.

## Acceptance Criteria
1. Sistema escolhe fluxo principal sem classificacao manual inicial.
2. Hard rules sobrepoem score quando necessario.
3. Razoes ficam visiveis para UI e auditoria.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 15.5 a 15.8 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Regra errada gerar recomendacao opaca.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-241`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
