# TASK-AT-264 - Yampi: parser e fixtures

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-264-yampi-parser-fixtures.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Connector / Yampi

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 20.4

## Objetivo unico
Criar parser e fixtures sanitizadas para produtos, kits, quantidades, valor, frete, cupom, cashback, bump, upsell, origem, titular, parcelas, transacoes, status e boleto.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-200`, `TASK-AT-218`, `TASK-AT-263`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-200`, `TASK-AT-218`, `TASK-AT-263`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/yampi/fixtures/
2. packages/shared/src/connectors/yampi.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Cobrir busca por nome, CPF, e-mail e pedido Yampi.
2. Criar fixtures de resultado vazio e multiplo.
3. Normalizar NOT_FOUND_IN_SOURCE para ausencia.

## Acceptance Criteria
1. Parser cobre campos da SPEC.
2. Ausencia de pedido nao encerra investigacao.
3. Boleto/link de pagamento nao e aberto.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 20.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Tratar ausencia na Yampi como pedido inexistente.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-265`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
