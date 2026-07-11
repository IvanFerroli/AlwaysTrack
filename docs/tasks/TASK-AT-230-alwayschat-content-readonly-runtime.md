# TASK-AT-230 - AlwaysChat: content script read-only

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-230-alwayschat-content-readonly-runtime.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / AlwaysChat

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.1, 20.1, 29.1

## Objetivo unico
Extrair intake de conversa aberta no AlwaysChat, podendo rolar historico em modo somente leitura, sem responder, resolver, transferir ou tabular.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-206`, `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-229`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-206`, `TASK-AT-207`, `TASK-AT-208`, `TASK-AT-218`, `TASK-AT-220`, `TASK-AT-222`, `TASK-AT-229`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/alwayschat/
2. services/companion-host/src/orchestrator/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Validar aba ativa como atendimento suportado.
2. Extrair dados visiveis e historico carregado.
3. Detectar necessidade de intervencao ou carregamento adicional.

## Acceptance Criteria
1. Intake cria fatos ALWAYSCHAT sem alterar atendimento.
2. Nenhuma acao de resposta/tabulacao/resolucao existe.
3. Falha de seletor fica isolada.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 4.1, 20.1, 29.1 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- AlwaysChat mudar DOM e quebrar intake.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-231`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
