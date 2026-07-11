# TASK-AT-198 - CaseFlow: contratos compartilhados de caso e evidencia

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-198-caseflow-shared-contracts.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / Contracts

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 9 a 11, 24

## Objetivo unico
Definir tipos compartilhados para caso, estados, EvidenceFact, EvidenceConflict, sensibilidade, origem, aquisicao, freshness e lifecycle.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-194`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-194`.

## Alvos explicitos
1. packages/shared/src/case-flow/
2. docs/architecture/caseflow-architecture.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Modelar estados NEW a FAILED.
2. Modelar fatos normalizados e conflitos sem sobrescrever silenciosamente.
3. Incluir sourceSystem ALWAYSCHAT, MANUAL, DERIVED e ConnectorId.

## Acceptance Criteria
1. Contratos cobrem os campos minimos da SPEC.
2. Falha isolada de conector nao transforma caso em FAILED.
3. Tipos podem ser consumidos por API, host, extensao e testes.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 9 a 11, 24 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Contrato incompleto gerar retrabalho em API e conectores.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-199`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
