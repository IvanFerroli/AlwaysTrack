# TASK-AT-290 - CaseFlow: metricas de sucesso do Copiloto SAC

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-290-caseflow-success-metrics.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Observability / Product Metrics

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 26.1 e 37

## Objetivo unico
Medir tempo ate resposta pronta, cliques, caracteres digitados, abas visitadas, fluxos corrigidos, mensagens reeditadas, casos sem ChatGPT e taxa por conector.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-228`, `TASK-AT-284`, `TASK-AT-289`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-228`, `TASK-AT-284`, `TASK-AT-289`.

## Alvos explicitos
1. services/api/src/core/case-flow/metrics.service.ts
2. apps/web/src/views/case-flow-metrics.tsx

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Criar metricas sem texto sensivel.
2. Incluir correcao manual e uso de copia/draft.
3. Expor estimativa de tempo/digitacao evitada.

## Acceptance Criteria
1. Metricas respondem a ergonomia e reducao de carga mental.
2. PII nao entra nos logs.
3. Uso diario e taxa de conector ficam visiveis.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 26.1 e 37 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Medir quantidade sem medir valor ergonomico.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-291`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
