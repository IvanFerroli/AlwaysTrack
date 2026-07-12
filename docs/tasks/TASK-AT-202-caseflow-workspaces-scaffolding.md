# TASK-AT-202 - CaseFlow: scaffolding de workspaces

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-202-caseflow-workspaces-scaffolding.md

## Modo
- mode: scaffolding
- generation-mode: corrective-spec-breakdown

## Capability
Repository / Scaffolding

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 6

## Objetivo unico
Preparar estrutura de pastas e metadados minimos de workspace para packages compartilhados, Companion Host, extensao Chromium e core CaseFlow sem implementar runtime funcional.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-195`, `TASK-AT-196`, `TASK-AT-197`, `TASK-AT-198`, `TASK-AT-199`, `TASK-AT-200`, `TASK-AT-201`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-195`, `TASK-AT-196`, `TASK-AT-197`, `TASK-AT-198`, `TASK-AT-199`, `TASK-AT-200`, `TASK-AT-201`.
- gate operacional obrigatorio: checklist aplicavel de `docs/operations/companion-topology-gate.md` registrado antes de concluir esta task.

## Alvos explicitos
1. packages/shared/src/case-flow/
2. packages/shared/src/companion/
3. apps/companion-extension/
4. services/companion-host/
5. services/api/src/core/case-flow/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Criar estrutura base alinhada ao monorepo existente.
2. Separar host local de backend principal.
3. Definir `package.json`, `tsconfig`, scripts `build`, `typecheck` e `test` para host e extensao quando a task for executada.
4. Registrar escolha de bundler/build da extensao MV3 antes de `TASK-AT-203`.
5. Planejar integracao com `npm run up`/bancada local sem iniciar runtime automaticamente.
6. Atualizar lockfile apenas se a execucao futura instalar dependencia aprovada; nesta rodada documental nao instalar nada.

## Acceptance Criteria
1. A estrutura respeita as quatro camadas.
2. Nao ha codigo funcional de scraping ou WebSocket real nesta task documental.
3. Proximas tasks tem alvos claros.
4. `TASK-AT-203` nao precisa inventar metadata, scripts ou bundler para compilar a extensao.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.
4. O retorno informa se houve ou nao alteracao de `package.json`, `tsconfig`, scripts e lockfile.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 6 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Acoplar host ao backend principal cedo demais.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-203`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
