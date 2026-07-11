# TASK-AT-233 - Rastreio no Lancador: parser e fixtures

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-233-rastreio-lancador-parser.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Connector / Rastreio

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 20.2

## Objetivo unico
Criar parser e fixtures sanitizadas do Rastreio no Lancador para pedidos recentes, status, previsao, produtos, pagamento, endereco, transportadora, movimentacoes, reenvios, entrega e codigos.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-200`, `TASK-AT-218`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-200`, `TASK-AT-218`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/rastreio/fixtures/
2. packages/shared/src/connectors/rastreio.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Mapear busca por CPF, pedido, e-mail e telefone.
2. Criar fixture de resultado unico, vazio e multiplo.
3. Normalizar fatos logisticos e de pedido.
4. Extrair explicitamente movimentacoes, reenvios e entrega quando presentes.

## Acceptance Criteria
1. Parser cobre campos extraidos da SPEC, incluindo movimentacoes, reenvios e entrega.
2. Resultado vazio nao bloqueia outros conectores.
3. Fixtures nao contem dados reais.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 20.2 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Conector universal depender de chave fragil unica.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-234`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
