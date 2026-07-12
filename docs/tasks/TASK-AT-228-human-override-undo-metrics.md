# TASK-AT-228 - CaseFlow Core: desfazer overrides e metricas de correcao

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-228-human-override-undo-metrics.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / Human Override

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 26.1, 36.4, 37

## Objetivo unico
Criar suporte a desfazer evidencia manual, conflito manual e correcao de fluxo, alem de metricas de correcoes para melhorar regras.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-225`, `TASK-AT-226`, `TASK-AT-227`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-225`, `TASK-AT-226`, `TASK-AT-227`.

## Alvos explicitos
1. services/api/src/core/case-flow/overrides.service.ts
2. services/api/src/core/case-flow/metrics.service.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Implementar undo auditavel por override.
2. Contabilizar fluxo corrigido, conflito resolvido manualmente e evidencia manual.
3. Expor sinais para painel e golden cases futuros.

## Acceptance Criteria
1. Usuario consegue desfazer sem apagar historico.
2. Metricas diferenciam erro de regra, falta de conector e decisao humana.
3. Feedback fica disponivel para melhoria de regras.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 26.1, 36.4, 37 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Desfazer apagar evidencia original ou auditoria.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-229`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
