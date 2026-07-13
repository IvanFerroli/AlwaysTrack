# TASK-AT-281 - Lancador de Pedidos: preparacao de rascunho

## Metadata
- status: implementation-complete-live-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-281-lancador-draft-preparation.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / Lancador Draft

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 20.3, 28 Fase 4

## Objetivo unico
Preparar rascunho no Lancador sem gerar, confirmar, disparar, recuperar pagamento, criar reenvio ou venda.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-276`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-276`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/lancador/draft.ts
2. apps/companion-extension/src/side-panel/actions/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Preencher tipo, produtos, quantidades, endereco, motivo e forma de pagamento somente como rascunho autorizado.
2. Bloquear botao final pelo Companion.
3. Alertar que geracao permanece manual.

## Acceptance Criteria
1. FILL_FORM so entra apos firewall e testes negativos.
2. Botao final nunca e acionado pelo Companion.
3. Usuario recebe checklist de revisao.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 20.3, 28 Fase 4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Gerar pedido automaticamente por engano.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-282`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
