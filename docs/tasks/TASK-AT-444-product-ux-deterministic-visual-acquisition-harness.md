# TASK-AT-444 - Harness deterministico de aquisicao visual Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-444-product-ux-deterministic-visual-acquisition-harness.md

## Modo
- mode: quality
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Visual Acquisition Harness

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- Contrato visual de `TASK-AT-443`.
- Infraestrutura de `TASK-AT-312`, `TASK-AT-313`, `TASK-AT-314` e `TASK-AT-336`.
- Evidencia de browser bloqueado registrada em `TASK-AT-358`.

## Objetivo unico
Materializar um harness local que inicia estado controlado, navega por role/jornada e produz screenshots e manifests sanitizados conforme o contrato visual.

## Contexto minimo
Autonomia visual exige browser real e estado reproduzivel. O harness nao pode depender de clique manual, banco pessoal, ordem aleatoria, baseline autoaceita ou fallback para leitura de codigo quando Chromium falhar.

## Inputs
- Contrato e codigos de resultado de `TASK-AT-443`.
- Startup local, seed deterministico e helpers de login existentes.
- Matriz inicial de roles, rotas, estados e viewports.
- Politica Playwright de screenshots/traces somente quando autorizados.

## Dependencias
- satisfeitas: Playwright e workbench local ja versionados no repositorio.
- em aberto: `TASK-AT-443`; browser funcional no host ou estrategia aceita de browser controlado.

## Alvos explicitos
1. Harness em `scripts/` ou `tests/e2e/` conforme convencao aceita.
2. Configuracao Playwright/fixtures estritamente necessaria.
3. Diretorio temporario/controlado de artefatos e manifesto de captura.
4. Documentacao curta de invocacao consumida pela skill.

## Fora de escopo
- Criar o agente ou o SKILL final.
- Instalar pacote nativo sem autorizacao operacional.
- Capturar producao, conectores live, SSO ou CAPTCHA.
- Alterar UI para facilitar screenshots.

## Checklist de execucao
1. Subir API/Web e banco temporario ou reutilizar startup controlado sem tocar dado pessoal.
2. Aplicar seed deterministico e autenticar roles previstas.
3. Navegar por rota e estado declarados, nunca por exploracao cega.
4. Capturar desktop/mobile e estados loading, empty, error e success quando a fixture suportar.
5. Estabilizar animacao, transicao, fonte, caret, clock, scroll e dados variaveis.
6. Gerar manifesto com commit, browser, viewport, role, rota, estado e checksum.
7. Sanitizar artefatos e remover contexto temporario de forma segura.
8. Falhar com codigo contratual quando browser, seed, login ou rota nao estiverem prontos.

## Acceptance Criteria
1. Duas execucoes com o mesmo commit/fixture produzem estado equivalente e manifests comparaveis.
2. Nenhum cookie, token, PII, HTML sensivel ou dado de sessao aparece nos artefatos.
3. Ausencia de `libnspr4.so` ou outra dependencia termina como `VISUAL_ACQUISITION_BLOCKED` com diagnostico objetivo.
4. O harness nao autoaceita baseline nem chama code review de screenshot.
5. A skill futura consegue invocar o harness por interface documentada e limitada.

## Definition of Done
1. Harness e fixtures minimos materializados com teste de sucesso e falha.
2. Manifesto de evidencia obedece `TASK-AT-443`.
3. Cleanup, privacidade e comportamento fail-closed validados.

## Validacao
- comandos/checks: testes focados do harness, captura repetida, `npm run check`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: inspecionar screenshots, manifests, diretorios temporarios e falha por browser indisponivel.

## Evidencia esperada
- Comandos e exit codes de captura valida e bloqueada.
- Screenshots sinteticos e manifests sanitizados.
- Prova de cleanup e ausencia de segredos.

## Riscos
- Harness flakey emitir findings sobre diferenca de clock, fonte ou seed.
- Captura autonoma persistir dado sensivel ou operar fora do tenant/role esperado.

## Blockers possiveis
- Browser local sem dependencias nativas.
- Ambiente nao permite iniciar API/Web ou Playwright.
- Jornada depende de sistema externo, SSO, CAPTCHA ou dado nao sintetizavel.

## Proximo passo provavel
`TASK-AT-445`

## Feedback obrigatorio de retorno
- comandos de aquisicao
- evidencias geradas
- classificacao do ambiente
- blockers e limitacoes reais

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear em modo quality e materializar somente o harness contratado, com evidencia visual real ou blocker.
- constraints: sem agente, SKILL final, autoaccept, producao, dado real ou instalacao nativa nao autorizada.
