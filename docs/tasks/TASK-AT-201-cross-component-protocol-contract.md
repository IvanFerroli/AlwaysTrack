# TASK-AT-201 - Companion: protocolo e fronteiras entre extensao, host e API

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-201-cross-component-protocol-contract.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Companion / Protocol

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 22 e 23

## Objetivo unico
Definir eventos e contratos de comunicacao Host <-> Extensao, Extensao <-> AlwaysTrack e Host <-> AlwaysTrack, incluindo handshake, progresso, resultado, intervencao, draft e health.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-196`, `TASK-AT-200`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-196`, `TASK-AT-200`.

## Alvos explicitos
1. packages/shared/src/companion/
2. docs/architecture/companion-protocol.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir eventos COMPANION_HELLO a HEALTH_REPORT.
2. Definir quando extensao chama API diretamente e quando host chama API.
3. Exigir caseId, userId local correlacionado, installationId, browser profile marker e runId quando aplicavel.

## Acceptance Criteria
1. Cada fronteira tem chamador, autenticacao e dados proibidos definidos.
2. Eventos progressivos carregam campos suficientes para UI e auditoria.
3. O protocolo nao abre porta externa nem aceita origem arbitraria.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 22 e 23 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Cobrir apenas Host-Extensao e deixar API ambigua.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-202`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
