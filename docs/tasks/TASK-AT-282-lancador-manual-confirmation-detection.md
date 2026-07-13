# TASK-AT-282 - Lancador: deteccao pos-acao manual e alerta Slack

## Metadata
- status: implementation-complete-live-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-282-lancador-manual-confirmation-detection.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / Lancador Draft

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 20.3 e exemplo 35.4

## Objetivo unico
Detectar confirmacao manual bem-sucedida no Lancador, capturar numero de pedido gerado, alertar registro obrigatorio no Slack e gerar texto sem postar.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-277`, `TASK-AT-281`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-277`, `TASK-AT-281`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/lancador/manual-detection.ts
2. apps/companion-extension/src/side-panel/actions/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Detectar numero apos usuario gerar manualmente.
2. Gerar alerta de Slack/manual checklist.
3. Permitir desfazer preparacao local quando possivel.

## Acceptance Criteria
1. Deteccao pos-acao nao clica no botao final.
2. Numero capturado vira EvidenceFact manual/derivado com auditoria.
3. Slack continua copiar/manual.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 20.3 e exemplo 35.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Confundir deteccao manual com automacao de confirmacao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-283`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
