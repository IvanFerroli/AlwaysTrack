# TASK-AT-447 - Forward evals adversariais e golden cases do especialista Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-447-product-ux-quality-evals-golden-cases.md

## Modo
- mode: quality
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Quality and Evals

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- Contratos e rubricas de `TASK-AT-442`, `TASK-AT-443` e `TASK-AT-445`.
- Agente roteavel de `TASK-AT-446`.
- Casos historicos `TASK-AT-066`, `123`, `138`, `312`, `314`, `351`, `358`, `404` e `405`.

## Objetivo unico
Criar um conjunto versionado de golden cases, casos adversariais e forward evals que prove utilidade UX, aderencia a evidencia, consistencia e respeito de fronteiras antes dos pilotos reais.

## Contexto minimo
Um agente pode produzir texto convincente e ainda confundir preferencia com problema, ignorar role/estado, aceitar screenshot stale ou invadir arquitetura e implementacao. Evals precisam testar comportamento em casos conhecidos e ineditos, nao estilo de escrita nem memorizacao dos fixtures.

## Inputs
- Contratos de request/output/evidencia.
- Rubricas do skill package.
- Fixtures e screenshots sinteticos ou historicos sanitizados.
- Casos bons, ruins, ambiguos e bloqueados.

## Dependencias
- satisfeitas: Quality Builder e padroes de eval existentes.
- em aberto: `TASK-AT-442` a `TASK-AT-446`.

## Alvos explicitos
1. Fixtures/golden cases no destino definido pela estrategia de qualidade.
2. Eval plan e assertions para os tres modos.
3. Quality gate report com thresholds e falhas bloqueantes.
4. Casos negativos de ownership, evidencia e privacidade.

## Fora de escopo
- Corrigir UI ou reescrever o agente durante o mesmo gate sem task propria.
- Usar screenshot sensivel ou dado de producao.
- Medir apenas palavras-chave, tamanho de resposta ou coverage cosmetico.

## Checklist de execucao
1. Cobrir finding valido, falso positivo, preferencia subjetiva e evidencia insuficiente.
2. Cobrir role incorreta, estado omitido, viewport divergente e screenshot stale.
3. Cobrir Figma/target ausente e bug nao reproduzivel que exige referencia humana.
4. Cobrir invasao de arquitetura, docs, runtime, quality e verifier.
5. Avaliar interaction spec com estados, responsive, teclado, foco, copy e privacidade.
6. Avaliar advisory review sem aceite final.
7. Separar golden cases de desenvolvimento de um conjunto forward selado, nao usado para escrever prompt, rubrica ou exemplos.
8. Incluir ataques de prompt injection, evidencia contraditoria, screenshot truncado, PII, rota errada e pedido para implementar ou autoaprovar.
9. Definir thresholds e classificacoes bloqueantes explicitos.

## Acceptance Criteria
1. Golden cases possuem rationale e resultado esperado, incluindo ambiguidade legitima.
2. O agente falha fechado quando falta evidencia ou referencia obrigatoria.
3. Falso positivo, invasao de ownership e vazamento sensivel bloqueiam o gate.
4. Evals provam comportamento e handoff, nao apenas formato textual.
5. Resultados sao reproduziveis e ligados a versao do agente/skill/fixtures.
6. O conjunto forward permanece separado dos exemplos de desenvolvimento e mede generalizacao em casos nao vistos.
7. Qualquer degradacao fail-open diante de browser, seed, autenticacao, sanitizacao ou evidencia invalida resulta em `NO-GO`.
8. O agente nao implementa produto, nao cria o proprio aceite e nao substitui Quality Builder ou Task Verifier nos casos adversariais.

## Definition of Done
1. Fixtures, golden cases, forward evals e gate adversarial materializados e executados.
2. Falhas possuem diagnostico e owner de follow-up.
3. Nenhum baseline foi autoaceito.

## Validacao
- comandos/checks: suites golden e forward, ataques adversariais, checks de fixture/sanitizacao, `npm run check`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: amostra de outputs bons, ruins, ambiguos e bloqueados.

## Evidencia esperada
- Relatorio por golden/forward case, versao e classificacao, sem expor respostas seladas no material de authoring.
- Taxa de acerto, falsos positivos e blockers de fronteira/privacidade.

## Riscos
- Golden cases pequenos demais favorecerem memorizacao ou formato.
- Contaminacao do conjunto forward pelo prompt, exemplos ou tuning do agente.
- Transformar gosto historico em verdade UX universal.

## Blockers possiveis
- Agente/routing ainda nao reproduziveis.
- Fixtures visuais sem proveniencia ou sanitizacao suficiente.

## Proximo passo provavel
`TASK-AT-448`

## Feedback obrigatorio de retorno
- casos golden, adversariais e forward evals criados
- resultados e thresholds
- falhas bloqueantes
- recomendacao para piloto

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Quality Builder e emitir gate com evidencia, sem corrigir comportamento fora da task.
- constraints: sem UI, producao, autoaccept, reescrita de escopo ou aceite final.
