# TASK-AT-280 - AlwaysChat: inserir rascunho autorizado

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-280-alwayschat-insert-draft-authorized.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Connector / AlwaysChat Draft

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 20.1, 19.2, 28 Fase 4

## Objetivo unico
Permitir inserir rascunho no AlwaysChat somente por clique explicito, depois de firewall, regressao negativa, API de mensagens e auditoria.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-230`, `TASK-AT-261`, `TASK-AT-262`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-230`, `TASK-AT-261`, `TASK-AT-262`.

## Alvos explicitos
1. apps/companion-extension/src/connectors/alwayschat/draft.ts
2. services/api/src/core/case-flow/messages.handlers.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Exigir acao explicita do usuario.
2. Preencher somente campo de rascunho permitido.
3. Nunca enviar mensagem.

## Acceptance Criteria
1. INSERT_DRAFT so aparece apos protecoes.
2. Mensagem nao e enviada automaticamente.
3. Evento auditavel registra draft inserido.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 20.1, 19.2, 28 Fase 4 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Rascunho virar envio por atalho ou submit.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-281`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
