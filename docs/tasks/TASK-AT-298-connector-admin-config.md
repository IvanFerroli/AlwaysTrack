# TASK-AT-298 - AlwaysTrack Web: administracao de conectores e sistemas

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-298-connector-admin-config.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
AlwaysTrack Web / Connector Admin

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 5.4, 7.1, 26.2

## Objetivo unico
Criar configuracao administrativa de conectores, dominios, capacidades, risco, health, fixtures e ultima validacao.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-263`, `TASK-AT-287`, `TASK-AT-288`, `TASK-AT-289`, `TASK-AT-296`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-263`, `TASK-AT-287`, `TASK-AT-288`, `TASK-AT-289`, `TASK-AT-296`.

## Alvos explicitos
1. apps/web/src/views/case-flow-connectors.tsx
2. services/api/src/core/case-flow/connectors.handlers.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Exibir ConnectorDefinition e health.
2. Permitir marcar conector degradado/indisponivel.
3. Registrar ultima validacao manual.

## Acceptance Criteria
1. Cada sistema externo tem cobertura explicita.
2. Conector degradado nao some silenciosamente.
3. Configuracao nao guarda senha/cookie.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 5.4, 7.1, 26.2 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Admin virar ponto para credenciais externas.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-299`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
