# TASK-AT-297 - AlwaysTrack Web: administracao de regras heuristicas

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-297-heuristic-rules-admin.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
AlwaysTrack Web / Heuristic Admin

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 15, 27.1, 36.4

## Objetivo unico
Criar administracao de regras heuristicas versionadas, prioridades, riscos, golden cases e feedback de correcoes humanas.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-228`, `TASK-AT-239`, `TASK-AT-240`, `TASK-AT-243`, `TASK-AT-296`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-228`, `TASK-AT-239`, `TASK-AT-240`, `TASK-AT-243`, `TASK-AT-296`.

## Alvos explicitos
1. apps/web/src/views/case-flow-rules.tsx
2. services/api/src/core/case-flow/heuristics/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Listar regras e versoes.
2. Exibir feedback de overrides.
3. Preparar ativacao/desativacao com auditoria.

## Acceptance Criteria
1. Regra versionada e auditavel.
2. Correcoes humanas alimentam melhoria de regras.
3. Golden cases ajudam validar mudanca.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 15, 27.1, 36.4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Editar regra sem teste de regressao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-298`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
