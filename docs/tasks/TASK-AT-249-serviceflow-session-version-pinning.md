# TASK-AT-249 - ServiceFlowSession: sessao presa a versao

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-249-serviceflow-session-version-pinning.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
ServiceFlow / Session

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 8.3 e 17.5

## Objetivo unico
Garantir que ServiceFlowSession e ServiceFlowSessionStep usem a versao iniciada, preservem historico e suportem voltar passo.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-244`, `TASK-AT-245`, `TASK-AT-247`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-244`, `TASK-AT-245`, `TASK-AT-247`.

## Alvos explicitos
1. services/api/src/core/service-flows/service-flows.service.ts
2. services/api/src/core/case-flow/sessions.service.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Associar sessao a ServiceFlowVersion.
2. Persistir escolhas e passos.
3. Permitir voltar sem apagar evidencias.
4. Testar sessao existente enquanto fluxo e republicado.
5. Testar compatibilidade linear -> grafo sem apagar `ServiceFlowSessionStep`.
6. Garantir que steps versionados nao dependem de registros vivos que possam ser recriados por edicao.

## Acceptance Criteria
1. Sessao nao muda quando fluxo e republicado.
2. Voltar passo e auditavel.
3. Historico de escolhas fica consultavel.
4. Sessoes preexistentes continuam consultaveis apos migracao/adaptador.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 8.3 e 17.5 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Caso em andamento mudar com nova versao de fluxo.
- Historico quebrar se steps antigos forem apagados/recriados pelo editor atual.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-250`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
