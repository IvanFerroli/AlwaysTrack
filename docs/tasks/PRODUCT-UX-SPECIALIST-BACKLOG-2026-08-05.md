# Backlog do Especialista Product UX Olympus - 2026-08-05

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md

## Objetivo
Materializar um especialista Product UX local, completo e roteavel no padrao Olympus, capaz de adquirir evidencia visual do AlwaysTrack, auditar jornadas e produzir especificacoes de interacao sem duplicar arquitetura, documentacao, runtime, qualidade ou verificacao final.

## Estado observado
1. A malha Olympus ja possui agentes e skills para critica arquitetural, taskificacao, documentacao, contratos, scaffolding, runtime, qualidade, orquestracao e verificacao.
2. Nao existe especialista com ownership explicito sobre jornada, arquitetura de informacao da tela, hierarquia, densidade, estados, copy contextual, responsividade, teclado, foco e acessibilidade.
3. O backlog possui recorrencia suficiente de trabalho UX em navegacao por role, Fluxos, overlays, responsividade, acessibilidade, polimento por screenshots, Comunicacao e Treinamento.
4. Playwright, seeds, matrizes por role e regressao visual oferecem base reutilizavel em `TASK-AT-312`, `TASK-AT-313`, `TASK-AT-314` e `TASK-AT-336`.
5. A evidencia de `TASK-AT-358` registrou Chromium local indisponivel por ausencia de `libnspr4.so`; revisao de codigo ou build nao substitui captura visual quando esse blocker persistir.
6. A decisao humana desta rodada e criar a versao completa dentro do repositorio, preservando contrato portavel para eventual extracao futura.

## Decisoes assumidas
1. O nome canonico inicial sera `olympus_product_ux`, com skill package `olympus-product-ux`.
2. A primeira versao e local-first e pode ser extraida apenas apos contrato estavel, tres ciclos uteis e um segundo consumidor real.
3. Um unico skill package multimodo cobre `audit`, `interaction-spec` e `advisory-review`; proliferacao de skills fica fora da primeira versao.
4. O especialista nao implementa React/CSS, nao cria testes, nao aprova tasks, nao decide arquitetura e nao transforma sua saida em documento canonico por conta propria.
5. O agente pode adquirir imagens autonomamente quando app, seed, role, rota, estado, viewport e browser forem reproduziveis.
6. Ler JSX/CSS ou documentacao sem captura nao constitui validacao visual.
7. Prints, Figma ou outra referencia humana continuam obrigatorios quando o alvo estetico nao estiver documentado, o problema nao for reproduzivel ou houver decisao de produto entre alternativas validas.
8. Falha de browser, autenticacao, seed, rota ou sanitizacao gera `VISUAL_ACQUISITION_BLOCKED`; nao existe fallback silencioso para parecer visual baseado apenas em codigo.

## Fronteiras com a malha Olympus

| Superficie | Ownership do especialista UX | Ownership preservado |
| --- | --- | --- |
| jornada, hierarquia, densidade e estados | diagnosticar e especificar comportamento observavel | Taskyfier transforma decisao aceita em task |
| arquitetura, dados, seguranca e boundaries | apontar impacto percebido e decisao aberta | Critic e Contracts Builder decidem/formalizam |
| ADR, spec, task e runbook canonicos | fornecer input estruturado | Docs Formalizer materializa |
| React, CSS, componentes e wiring | fornecer interaction spec aceita | Runtime Builder implementa |
| testes, axe, Playwright e baselines | declarar riscos e cenarios esperados | Quality Builder materializa e executa |
| aceite da task | emitir advisory review | Task Verifier classifica com evidencia integral |
| roteamento | declarar capability e requisitos | Orchestrator escolhe modo e especialista |

## Artefatos finais esperados
1. ADR/spec de fronteiras e estrategia local-first.
2. Skill scaffold, contrato publico de review e contrato de evidencia visual.
3. Harness deterministico de aquisicao visual e manifesto sanitizado de captura.
4. Skill package completo com manifest, rubricas e templates.
5. Agente Codex, bundle Antigravity e roteamento Olympus.
6. Golden cases, evals e quality gate do comportamento specialist.
7. Runbook, estado operacional, pilotos reproduziveis e gate final.

## Tasks e prioridades

### Fundacao e contratos - P0
1. `TASK-AT-440` - decisao canonica, fronteiras e nao objetivos do especialista.
2. `TASK-AT-441` - scaffold estrutural do skill package Product UX.
3. `TASK-AT-442` - contrato publico de audit, interaction spec e advisory review.
4. `TASK-AT-443` - contrato de aquisicao, classificacao e privacidade da evidencia visual.

### Materializacao do especialista - P0
5. `TASK-AT-444` - harness deterministico de aquisicao visual local.
6. `TASK-AT-445` - skill package completo, rubricas e templates.
7. `TASK-AT-446` - agente, bundle Antigravity e roteamento pelo Orchestrator.

### Qualidade, operacao e fechamento - P1
8. `TASK-AT-447` - golden cases, forward evals adversariais e quality gate do especialista.
9. `TASK-AT-448` - runbook, estado operacional e protocolo de evidencia UX.
10. `TASK-AT-449` - pilotos ponta a ponta em jornadas reais do AlwaysTrack.
11. `TASK-AT-450` - gate final de prontidao e decisao de ativacao.

## Ordem e caminho critico
`440 -> 441 -> 442 -> 443 -> 444 -> 445 -> 446 -> 447 -> 448 -> 449 -> 450`

Nenhum agente, skill ou routing deve ser materializado antes de `TASK-AT-440` a `TASK-AT-443`. O gate final nao pode ser antecipado por uma demonstracao visual isolada.

## Blockers humanos preservados
1. Referencia alvo ausente quando o pedido exige semelhanca com Figma, concorrente, identidade nova ou preferencia estetica.
2. Bug exclusivo da maquina, browser, sistema operacional, dado ou dispositivo do usuario que nao pode ser reproduzido localmente.
3. Duas solucoes UX validas com impacto distinto de produto, permissao ou politica.
4. Tela externa/protegida, SSO, CAPTCHA ou credencial que o harness nao pode acessar.
5. Uso de dado real ou screenshot sensivel sem base, redaction e autorizacao explicitas.

## Riscos transversais
1. Criar um agente generico de opiniao estetica sem evidencia ou contexto de jornada.
2. Duplicar Critic, Docs Formalizer, Runtime Builder, Quality Builder ou Task Verifier.
3. Chamar code review de validacao visual quando o browser estiver indisponivel.
4. Persistir cookie, token, PII, HTML ou screenshot sensivel nos artefatos.
5. Autoaceitar baseline, ensinar para os proprios fixtures ou institucionalizar regressao visual.
6. Acoplar o skill a nomes do AlwaysTrack a ponto de impedir evolucao ou extracao futura.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: iniciar por `TASK-AT-440` e respeitar os modos documental, scaffolding, contracts, quality e runtime de cada task.
- constraints: sem implementar especialista, harness ou routing durante esta rodada documental; sem pular contratos; sem promover captura fake/local a evidencia live.
