# TASK-AT-199 - CaseFlow: contrato de capabilities e firewall de acao

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-199-action-capabilities-firewall-contract.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Security / Action Firewall

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.8, 19, 33, 34

## Objetivo unico
Declarar capabilities permitidas e proibidas, formato de acao auditavel e regra de que nenhuma ferramenta generica de clique existe.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-197`, `TASK-AT-198`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-197`, `TASK-AT-198`.

## Alvos explicitos
1. packages/shared/src/case-flow/action-capabilities.ts
2. docs/security/companion-threat-model.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir OPEN_TAB, FOCUS_TAB, NAVIGATE, SEARCH, READ, EXTRACT, COPY, INSERT_DRAFT, FILL_FORM e proibicoes.
2. Definir shape de acao com conector, capability, alvo, risco, confirmacao, log e resultado.
3. Documentar que SUBMIT, SEND_MESSAGE, CHANGE_STATUS, CREATE_ORDER, CREATE_REVERSE, OPEN_TICKET e POST_SLACK sao proibidos no core inicial.

## Acceptance Criteria
1. Capabilities aparecem em contratos de fluxo e conector.
2. INSERT_DRAFT e FILL_FORM exigem acao explicita e firewall posterior.
3. O contrato bloqueia agente futuro irrestrito.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 4.8, 19, 33, 34 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Permitir automacao critica por omissao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-200`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
