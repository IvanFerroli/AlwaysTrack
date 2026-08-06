# TASK-AT-449 - Pilotos ponta a ponta do especialista Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-449-product-ux-end-to-end-pilots.md

## Modo
- mode: quality
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / End-to-End Pilot Evaluation

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- Artefatos e gates de `TASK-AT-440` a `TASK-AT-448`.
- Jornadas candidatas historicas `TASK-AT-351` e `TASK-AT-358`.
- Jornadas futuras candidatas `TASK-AT-421` e `TASK-AT-434` quando reproduziveis.

## Objetivo unico
Executar pilotos reproduziveis do especialista em jornadas reais ou fixtures fieis do AlwaysTrack para provar aquisicao visual autonoma, utilidade dos pareceres e handoff correto sem implementar correcoes.

## Contexto minimo
Golden cases nao provam o comportamento completo com browser, seed, roles, rotas, estados e agentes da malha. O piloto deve exercitar a cadeia real e distinguir sucesso, referencia humana obrigatoria e blocker tecnico.

## Inputs
- Agente, skill, roteamento e harness aprovados para piloto.
- Runbook e estado `pilot-ready`.
- Jornadas com seed, role, rota, estado e viewport reproduziveis.
- Uma solicitacao deliberadamente dependente de referencia humana.

## Dependencias
- satisfeitas: superficies historicas e novos dominios com manifests de UI disponiveis.
- em aberto: `TASK-AT-440` a `TASK-AT-448`; `TASK-AT-421`/`434` somente se ja implementadas e reproduziveis.

## Alvos explicitos
1. Plano de piloto com pelo menos tres jornadas distintas e matriz role/estado/viewport.
2. Pacotes de evidencia sanitizados e manifests de captura.
3. Outputs `audit`, `interaction-spec` e `advisory-review` conforme aplicavel.
4. Relatorio de utilidade, falsos positivos, blockers, handoffs e tempo operacional.

## Fora de escopo
- Implementar ou corrigir React, CSS, componentes, dados ou testes do produto.
- Alterar prompt, skill, harness ou routing dentro do piloto para esconder falha.
- Substituir captura indisponivel por inspecao de codigo ou build.
- Promover sugestao do especialista diretamente a task aceita ou deploy.

## Checklist de execucao
1. Selecionar uma jornada estavel ja conhecida e duas jornadas novas ou significativamente distintas.
2. Registrar versoes, seed, role, rota, estado, browser e viewports antes de cada execucao.
3. Capturar evidencias autonomamente e comprovar sanitizacao e proveniencia.
4. Exercitar os tres modos, incluindo handoff para Runtime, Quality e Verifier sem invasao de ownership.
5. Exercitar referencia humana ausente e ao menos um blocker tecnico controlado.
6. Comparar achados com observacao humana cega e registrar falsos positivos/negativos.
7. Reexecutar uma jornada para medir consistencia sem autoaceitar baseline.
8. Registrar follow-ups fora do piloto sem corrigi-los na mesma task.

## Acceptance Criteria
1. Ao menos tres jornadas possuem pacote reproduzivel; uma delas deve ser desconhecida dos exemplos de authoring do agente.
2. Quando o ambiente e reproduzivel, o especialista adquire evidencia visual sem pedir screenshot manual ao usuario.
3. Quando referencia humana e obrigatoria, o especialista retorna `REFERENCE_REQUIRED` com pergunta objetiva e nao inventa o alvo.
4. Falha de browser, seed, login, rota, estado ou sanitizacao retorna blocker fail-closed e impede conclusao visual.
5. Nenhum output implementa produto, cria teste, altera documento canonico ou emite aceite final.
6. Handoffs distinguem Product UX, Runtime Builder, Quality Builder e Task Verifier.
7. Evidencias nao contem token, cookie, PII ou dado real nao autorizado.
8. Falsos positivos, negativos, divergencias humanas e custo operacional ficam quantificados.

## Definition of Done
1. Matriz de pilotos executada e evidencias revisadas.
2. Blockers e follow-ups possuem owner e task recomendada, sem correcao oportunista.
3. Relatorio recomenda `GO`, `GO-WITH-RISK` ou `NO-GO` para o gate final.

## Validacao
- comandos/checks: execucao E2E do harness/agent routing, checks de sanitizacao, suites relevantes, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: avaliacao cega da utilidade e correção dos achados, mais auditoria de ownership.

## Evidencia esperada
- Manifests, screenshots sanitizados, outputs estruturados e logs sem secrets.
- Matriz piloto por jornada, role, estado e viewport.
- Comparativo humano/agente, falhas e recomendacao de gate.

## Riscos
- Escolher apenas fluxos conhecidos e superestimar generalizacao.
- Pilotar uma UI ainda nao implementada e confundir ausencia com falha do agente.
- Screenshots ou logs carregarem informacao sensivel.
- Ajustar o agente durante a medicao e invalidar o resultado.

## Blockers possiveis
- Chromium local ainda indisponivel por dependencia como `libnspr4.so`.
- Seed, role ou rota sem estado deterministico.
- Nenhuma jornada nova pronta; neste caso, o piloto nao pode ser declarado completo.

## Proximo passo provavel
`TASK-AT-450`

## Feedback obrigatorio de retorno
- jornadas e matriz executadas
- evidencias e codigos resultantes
- utilidade, falsos positivos e negativos
- handoffs e invasoes detectadas
- recomendacao GO/GO-WITH-RISK/NO-GO

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear a Quality Builder para executar pilotos imutaveis e devolver evidencia ao gate, sem corrigir o especialista ou o produto.
- constraints: sem implementacao UX, sem autoaceite, sem evidencia sensivel e sem chamar code review de captura visual.
