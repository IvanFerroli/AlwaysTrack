# TASK-AT-227 - CaseFlow API: correcao manual de classificacao e fluxo

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-227-flow-classification-override-api.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / Human Override

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 15.8, 16, 36.4

## Objetivo unico
Permitir corrigir fluxo/classificacao selecionada pelo sistema, com motivo, preservacao do candidato original e reexecucao de heuristica/plano.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-221`, `TASK-AT-224`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-221`, `TASK-AT-224`.

## Alvos explicitos
1. services/api/src/core/case-flow/overrides.handlers.ts
2. services/api/src/core/case-flow/overrides.service.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Registrar fluxo sugerido, fluxo escolhido e motivo.
2. Permitir marcar candidato como incorreto.
3. Preparar evento de feedback para melhorar regras.

## Acceptance Criteria
1. Correcao humana prevalece sobre recomendacao automatica.
2. Classificacao original fica auditada.
3. A correcao pode disparar recomputacao controlada.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 15.8, 16, 36.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Feedback humano nao ser usado para evolucao de regras.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-228`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
