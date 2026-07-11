# TASK-AT-208 - Extensao: UI de intervencao humana

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-208-human-intervention-ui.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Companion Extension / Intervention

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 14

## Objetivo unico
Criar componentes de intervencao para login, captcha, 2FA, seletor quebrado e timeout com abrir aba, continuar, ignorar, repetir ou entrada manual.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-204`, `TASK-AT-205`, `TASK-AT-207`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-204`, `TASK-AT-205`, `TASK-AT-207`.

## Alvos explicitos
1. apps/companion-extension/src/side-panel/interventions/
2. packages/shared/src/companion/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Renderizar estados BLOCKED_AUTH, BLOCKED_CAPTCHA, BLOCKED_2FA, FAILED_SELECTOR_DRIFT e FAILED_TIMEOUT.
2. Nunca pedir senha ou tentar bypass.
3. Permitir retomada apos acao manual.

## Acceptance Criteria
1. Intervencao nao trava o caso global.
2. Usuario pode abrir aba certa e retomar.
3. Captcha/2FA sao sempre manuais.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 14 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- UI pressionar usuario a burlar bloqueio.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-209`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
