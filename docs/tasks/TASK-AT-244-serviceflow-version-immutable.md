# TASK-AT-244 - ServiceFlow: versionamento imutavel publicado

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-244-serviceflow-version-immutable.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
ServiceFlow / Versioning

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.6 e 17.5

## Objetivo unico
Evoluir ServiceFlow existente para versoes publicadas imutaveis, sem criar produto concorrente e mantendo compatibilidade com fluxo atual.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-216`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-216`.

## Alvos explicitos
1. services/api/prisma/schema.prisma
2. services/api/src/core/service-flows/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Criar ServiceFlowVersion sem quebrar ServiceFlow atual.
2. Garantir que edicao cria nova versao publicada.
3. Auditar restauracao.
4. Criar migracao/adaptador de compatibilidade do modelo atual para versao publicada.
5. Proibir edicao in-place de versao publicada.
6. Cobrir o comportamento atual de `updateServiceFlow`, que apaga e recria steps, para nao invalidar sessoes existentes.

## Acceptance Criteria
1. Sessao futura pode ficar presa a versao iniciada.
2. Nova versao nao altera casos em andamento.
3. Fluxos atuais continuam operando.
4. Migracao preserva fluxos e sessoes existentes ou documenta bloqueio antes de execucao.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 4.6 e 17.5 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Quebrar Fluxos de Atendimento ja entregues.
- Cascade em ServiceFlowStep apagar historico de sessao se versionamento for aplicado sem adaptador.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-245`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
