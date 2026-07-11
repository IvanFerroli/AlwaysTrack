# TASK-AT-200 - Companion: contrato de conector consultivo

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-200-consultative-connector-contract.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Connectors / Contract

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 12 a 14, 20, 27.4

## Objetivo unico
Formalizar ConsultativeConnector, estados, resultados, selector policy, fixtures, health, drift e intervencoes humanas.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-198`, `TASK-AT-199`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-198`, `TASK-AT-199`.

## Alvos explicitos
1. packages/shared/src/connectors/
2. docs/architecture/companion-connector-contract.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir probe, resolveApplicability, buildSearchPlan, execute, normalize, detectIntervention e healthCheck.
2. Normalizar estados QUEUED a CANCELLED.
3. Exigir fixtures sanitizadas, seletor primario/fallback e detector de pagina inesperada.

## Acceptance Criteria
1. Cada conector futuro declara dominios, capacidades, chaves, risco, seletores e testes.
2. Estados de login, captcha, 2FA, timeout e drift sao representados.
3. Um conector quebrado nao afeta os demais.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 12 a 14, 20, 27.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Conectores crescerem com contratos incompatíveis.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-201`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
