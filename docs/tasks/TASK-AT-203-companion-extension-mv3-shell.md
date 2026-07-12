# TASK-AT-203 - Extensao: shell Chromium Manifest V3

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-203-companion-extension-mv3-shell.md

## Modo
- mode: scaffolding
- generation-mode: corrective-spec-breakdown

## Capability
Companion Extension / Shell

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 5.3, 7, 20.11

## Objetivo unico
Criar o shell da extensao MV3 com manifest, permissoes minimas, service worker e side panel inicial.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-195`, `TASK-AT-197`, `TASK-AT-201`, `TASK-AT-202`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-195`, `TASK-AT-197`, `TASK-AT-201`, `TASK-AT-202`.
- gate operacional obrigatorio: checklist aplicavel de `docs/operations/companion-topology-gate.md` registrado antes de concluir esta task.

## Alvos explicitos
1. apps/companion-extension/manifest.json
2. apps/companion-extension/src/background/
3. apps/companion-extension/src/side-panel/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir manifest MV3 e permissoes de host explicitas.
2. Criar service worker minimo sem leitura de paginas externas.
3. Preparar side panel vazio para Copiloto SAC.

## Acceptance Criteria
1. Extensao compila quando dependencias forem instaladas em task propria.
2. Permissoes sao minimas e documentadas.
3. Nao ha scraping real nem sistemas externos nesta task.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 5.3, 7, 20.11 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Permissoes amplas demais no manifest.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-204`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
