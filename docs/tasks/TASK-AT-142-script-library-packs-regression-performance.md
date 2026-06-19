# TASK-AT-142 - Scriptoteca: regressao e stress dos pacotes

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-142-script-library-packs-regression-performance.md
- execution-log: docs/tasks/EXEC-AT-142-script-library-packs-regression-performance.md

## Modo
- mode: quality

## Objetivo unico
Adicionar cobertura automatizada e de carga leve para os pacotes/roteiros da Scriptoteca, protegendo criacao, edicao, reordenacao, leitura e copia depois das tasks recentes.

## Contexto minimo
As tasks `TASK-AT-126`, `TASK-AT-140` e `TASK-AT-141` consolidaram pacotes de scripts, edicao visual e validacao runtime. A auditoria de 18/06/2026 confirmou que ha unit tests de service/validacao e documentacao suficiente, mas os cenarios Playwright/Artillery ainda nao exercitam especificamente pacotes da Scriptoteca. Isso cria risco de regressao silenciosa no fluxo novo de atendimento.

## Inputs
- `TASK-AT-126-script-library-script-packs.md`
- `TASK-AT-140-script-pack-edit-reorder.md`
- `TASK-AT-141-script-library-runtime-validation.md`
- `tests/e2e/api-flows.api.spec.ts`
- `tests/e2e/commercial-browser.spec.ts`
- `tests/performance/alwaystrack-smoke.yml`
- `tests/performance/alwaystrack-1000.yml`

## Dependencias
- satisfeitas: API e UI de pacotes ja existem.
- em aberto: ambiente local/CI precisa conseguir rodar Playwright e Artillery como ja documentado.

## Alvos explicitos
1. `tests/e2e/api-flows.api.spec.ts`
2. `tests/e2e/commercial-browser.spec.ts`
3. `tests/performance/alwaystrack-smoke.yml`
4. `tests/performance/alwaystrack-1000.yml`
5. `docs/performance/README.md`
6. `docs/architecture/recent-test-doc-coverage-audit.md`

## Fora de escopo
- Reescrever a UI da Scriptoteca.
- Criar drag and drop.
- Criar historico/versionamento novo de pacote.
- Rodar benchmark real de 1000 usuarios em infraestrutura final.

## Checklist
1. Criar regressao API para listar pacotes, criar pacote, editar metadados e reordenar scripts.
2. Criar regressao browser curta para abrir Scriptoteca, selecionar um pacote e validar que os scripts aparecem na ordem esperada.
3. Cobrir o caminho de copia de script vindo de pacote, registrando evento sem quebrar placeholders.
4. Incluir `/v1/script-library` e endpoints de copia/pacotes nos cenarios Artillery smoke.
5. Incluir leitura da Scriptoteca no cenario de 1000 usuarios com peso menor que dashboard/ranking.
6. Atualizar docs de performance/cobertura explicando o que a nova cobertura protege.

## Acceptance Criteria
1. `npm run test:e2e:api` cobre o fluxo basico de pacotes da Scriptoteca.
2. `npm run test:e2e:smoke` ou spec browser equivalente valida visualmente o pacote principal sem depender de dado aleatorio.
3. `npm run perf:smoke:report -- --target=http://localhost:3333` acessa Scriptoteca/pacotes e gera report sem erro 4xx/5xx inesperado.
4. O cenario `perf:1000` inclui Scriptoteca como leitura de baixa frequencia, sem transformar stress em teste de escrita.
5. A documentacao deixa claro que isso e cobertura de regressao/stress local, nao certificacao final de producao.

## Definition of Done
1. Testes E2E/API adicionados ou ampliados.
2. Cenários Artillery atualizados.
3. Docs de performance/cobertura atualizados.
4. Roadmap atualizado.

## Resultado
- Regressao API cobre criacao, edicao, reordenacao, listagem e copia de scripts em pacotes.
- Smoke browser foi ampliado para navegar Avisos, Fluxos e Scriptoteca, mas a validacao local segue bloqueada por `libnspr4.so` ausente no Chromium.
- Artillery smoke inclui Fluxos, Scriptoteca e copia de script com captura dinamica de `scriptId`.
- Cenario `perf:1000` inclui Fluxos e Scriptoteca como leitura de baixa frequencia.
- `npm run up` e `perf-report` abrem artefatos HTML/docs/reports no navegador quando disponiveis.

## Validacao
- comandos/checks: `npm run test:e2e:api`, `npm run test:e2e:smoke`, `npm run perf:smoke:report -- --target=http://localhost:3333`
- revisao manual: abrir Scriptoteca, editar um pacote demo, confirmar ordem dos scripts e copiar um texto.

## Evidencia esperada
- Saida dos comandos acima.
- Report HTML/MD novo em `docs/performance/reports/`.
- Registro na auditoria de cobertura recente.

## Riscos
- Playwright local pode depender de libs do Chromium; seguir `docs/testing/playwright-ci.md` se falhar por ambiente.
- Stress local continua limitado pela maquina de desenvolvimento, entao nao substitui stage/producao.

## Blockers possiveis
- Seeds sem pacote deterministico suficiente para o browser test.
- Ambiente sem API/web rodando nos ports esperados.

## Retorno esperado
- resumo curto do que foi coberto
- evidencia de validacao
- limites da cobertura local
- proximo passo recomendado
