# TASK-AT-276 - Lancador de Pedidos: runtime de consulta

## Metadata
- status: implementation-complete-live-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-276-lancador-readonly-runtime.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / Lancador de Pedidos

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 20.3

## Objetivo unico
Consultar Lancador de Pedidos em modo read-only para cliente, pedido original, produtos, quantidades, endereco, pagamento e responsavel.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-213`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-263`, `TASK-AT-275`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-213`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-263`, `TASK-AT-275`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/lancador/read-only.ts
2. services/companion-host/src/orchestrator/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Buscar por evidencias disponiveis.
2. Extrair dados sem preencher formulario.
3. Registrar ConnectorRun e facts.

## Acceptance Criteria
1. Consulta Lancador nao toca rascunho.
2. Falha isolada nao bloqueia plano.
3. Dados alimentam possivel fluxo de reenvio.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 20.3 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Antecipar FILL_FORM antes do firewall.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-277`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
