# TASK-AT-223 - CaseFlow Security: regressao de acoes proibidas

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-223-forbidden-actions-regression.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
Security / Negative Tests

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.8, 19, 27.5

## Objetivo unico
Criar testes negativos para provar que enviar mensagem, submit, drag OMIE, post Slack, alterar status, gerar pedido, reversa ou ticket sao impossiveis no core inicial.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-222`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-222`.

## Alvos explicitos
1. services/api/src/core/case-flow/action-firewall.test.ts
2. apps/companion-extension/src/**/*.test.ts
3. services/companion-host/src/**/*.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Testar SEND_MESSAGE, SUBMIT, CHANGE_STATUS, CREATE_ORDER, CREATE_REVERSE, OPEN_TICKET e POST_SLACK.
2. Testar INSERT_DRAFT/FILL_FORM sem confirmacao explicita.
3. Testar drag/drop bloqueado para OMIE.

## Acceptance Criteria
1. Testes falham se capability proibida for exposta.
2. Nenhuma escrita sensivel pode entrar antes destes testes.
3. Evidencia negativa fica linkada aos rollouts.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 4.8, 19, 27.5 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Teste cobrir apenas API e esquecer extensao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-224`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
