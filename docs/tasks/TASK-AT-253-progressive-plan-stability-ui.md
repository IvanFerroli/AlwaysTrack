# TASK-AT-253 - Side panel: estabilidade visual da reconciliacao incremental

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-253-progressive-plan-stability-ui.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Companion Extension / Guided UI

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 7.2, 8.3, 21

## Objetivo unico
Mostrar atualizacoes de plano sem pular a interface, avisando quando nova evidencia muda recomendacao e preservando leitura/acao do usuario.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-248`, `TASK-AT-251`, `TASK-AT-252`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-248`, `TASK-AT-251`, `TASK-AT-252`.

## Alvos explicitos
1. apps/companion-extension/src/side-panel/plan-updates/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Congelar passo visual enquanto usuario le quando possivel.
2. Mostrar banner de recomendacao alterada.
3. Diferenciar plano atualizado, ramo invalidado e mensagem recompilada.

## Acceptance Criteria
1. Novos dados refinam o plano sem zerar a interface.
2. Mensagem ja copiada recebe aviso se ficar obsoleta.
3. Escolha humana prevalece visualmente.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 7.2, 8.3, 21 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Interface trocar de passo no meio da leitura.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-254`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
