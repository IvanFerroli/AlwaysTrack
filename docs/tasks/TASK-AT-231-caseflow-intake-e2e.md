# TASK-AT-231 - CaseFlow: intake ponta a ponta do caso inicial

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-231-caseflow-intake-e2e.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Vertical Slice / Intake

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 7.2 e 29.1

## Objetivo unico
Ligar extensao, host e API para criar caso a partir do AlwaysChat aberto e registrar intake/fatos iniciais.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-205`, `TASK-AT-211`, `TASK-AT-212`, `TASK-AT-224`, `TASK-AT-230`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-205`, `TASK-AT-211`, `TASK-AT-212`, `TASK-AT-224`, `TASK-AT-230`.

## Alvos explicitos
1. apps/companion-extension/src/side-panel/
2. services/companion-host/src/orchestrator/
3. services/api/src/core/case-flow/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Botao Montar caso inicia START_CASE.
2. Host cria caso/intake na API.
3. Side panel recebe progresso inicial.

## Acceptance Criteria
1. Caso nasce obrigatoriamente do AlwaysChat.
2. Intake fica visivel sem alterar atendimento.
3. Host offline tem erro recuperavel.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 7.2 e 29.1 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Vertical inicial mascarar falha de autenticacao local.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-232`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
