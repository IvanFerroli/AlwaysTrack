# TASK-AT-292 - CaseFlow: E2E com paginas fake

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-292-caseflow-fake-pages-e2e.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
E2E / Fake Pages

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 27.7 e 35

## Objetivo unico
Criar ambiente simulado com paginas fake para posicao de pedido, entrega nao reconhecida, J&T com captcha e pedido manual.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-236`, `TASK-AT-252`, `TASK-AT-253`, `TASK-AT-270`, `TASK-AT-272`, `TASK-AT-274`, `TASK-AT-281`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-236`, `TASK-AT-252`, `TASK-AT-253`, `TASK-AT-270`, `TASK-AT-272`, `TASK-AT-274`, `TASK-AT-281`.

## Alvos explicitos
1. tests/e2e/caseflow-fake-pages.spec.ts
2. tests/e2e/fixtures/caseflow/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Criar paginas fake sem sistemas reais.
2. Validar progressivo, captcha, stepper e rascunho sem confirmar.
3. Coletar artefatos de Playwright.

## Acceptance Criteria
1. E2E nao usa credenciais nem scraping real.
2. Caso com captcha e demonstravel.
3. Pedido manual nao clica no botao final.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 27.7 e 35 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- E2E depender de sistema externo.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-293`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
