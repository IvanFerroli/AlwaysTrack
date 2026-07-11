# TASK-AT-246 - ServiceFlow: testes estruturais de grafo

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-246-serviceflow-structural-validation-tests.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
ServiceFlow / Tests

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 27.2 e auditoria corretiva ponto 7

## Objetivo unico
Criar validadores e testes para loops, nos orfaos, fluxo sem inicio/final, transicoes impossiveis/duplicadas, ramo inalcançavel e risk gate ausente.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-245`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-245`.

## Alvos explicitos
1. services/api/src/core/service-flows/flow-validation.ts
2. services/api/src/core/service-flows/flow-validation.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Detectar START ausente, END ausente e orfaos.
2. Detectar transicao duplicada, impossivel e ramo inalcançavel.
3. Detectar ausencia de risk gate quando regra exige risco.

## Acceptance Criteria
1. Fluxos invalidos nao publicam.
2. Loops permitidos/negados sao explicitamente tratados.
3. Testes cobrem multiplos fluxos e version pinning.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 27.2 e auditoria corretiva ponto 7 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Fluxo publicado com ramo morto ou risco sem gate.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-247`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
