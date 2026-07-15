# TASK-AT-313 - E2E: matriz critica por role, viewport e jornada

## Metadata
- status: completed
- owner: olympus_runtime_builder
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-313-critical-role-e2e-matrix.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / E2E

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Executar jornadas criticas comerciais, administrativas e CaseFlow em desktop e mobile, com guardas positivos e negativos para cada papel operacional.

## Implementacao
1. `tests/e2e/critical-role-caseflow.api.spec.ts` prova criacao/leitura de caso sintetico e a fronteira administrativa para ADMIN, GESTOR, SAC, FINANCEIRO, VENDEDOR e SUPERVISOR.
2. `tests/e2e/critical-role.desktop.spec.ts` cobre ADMIN, GESTOR, FINANCEIRO e SUPERVISOR no viewport desktop, incluindo falha transitoria e retry do admin CaseFlow.
3. `tests/e2e/critical-role.mobile.spec.ts` cobre SAC e VENDEDOR no viewport mobile.
4. `tests/e2e/helpers.ts` reconhece login concluido pela shell autenticada, sem pressupor Dashboard para SAC.
5. `playwright.config.ts` separa arquivos por viewport, mantem execucao serial e eleva somente o limite de login da bancada isolada para evitar falso negativo da propria matriz.
6. O helper usa `E2E_API_BASE_URL` configuravel e aponta por padrao ao host isolado `127.0.0.1:3334`, impedindo que preparacao administrativa atravesse o proxy do frontend.
7. Traces, screenshots e videos continuam retidos apenas em falha; a suite usa exclusivamente SQLite temporario, seed sintetica e dominios locais.

## Matriz e criterios
A matriz executavel e a classificacao de risco estao em `docs/testing/e2e-critical-role-matrix.md`.

## Dependencias
- satisfeitas: TASK-AT-309, TASK-AT-310, TASK-AT-311 e bancada isolada existente.
- satisfeita por API: cobertura CaseFlow local sem conectores ou credenciais externas.
- satisfeita localmente: Chromium executado com `libnspr4` e `libnss3` extraidos em diretorio temporario, sem instalacao privilegiada nem alteracao do host.

## Fora de escopo preservado
- Nenhuma credencial externa, PII, scraping, conector live ou alteracao de producao.
- A suite nao declara evidencia production-like ou live.
- O smoke existente nao foi duplicado: a nova cobertura valida jornadas e permissoes por papel.

## Acceptance Criteria
1. Cada um dos seis papeis criticos possui jornada positiva e negativa na matriz: atendido no codigo e validado na camada API; erro, retry e estado vazio estao representados no browser administrativo.
2. Desktop e mobile participam do gate por risco: atendido e validado em Chromium local nos dois projetos.
3. Falhas geram artefatos reproduziveis sem dados sensiveis: atendido pela configuracao `retain-on-failure` e dados sinteticos.

## Validacao executada
- `npx playwright test tests/e2e/critical-role-caseflow.api.spec.ts --project=api`: 6/6 passaram.
- `npx playwright test tests/e2e/critical-role.desktop.spec.ts --project=desktop --grep 'GESTOR monitors'`: 1/1 passou apos validar o isolamento do host da API.
- `npx playwright test tests/e2e/critical-role.desktop.spec.ts tests/e2e/critical-role.mobile.spec.ts --project=desktop --project=mobile`: 6/6 passaram em Chromium.
- Evidencia: `local/fake`, em SQLite temporario, sem credenciais ou sistemas externos.

## Riscos residuais e proximo passo
- O runner oficial ainda deve instalar as dependencias Playwright pela imagem/esteira; a validacao local usou bibliotecas extraidas apenas em `/tmp`.
- A promocao sintetica de SAC para GESTOR exercita o contrato administrativo real porque GESTOR nao faz parte da seed padrao.
- TASK-AT-314 deve executar a validacao manual de leitor de tela/zoom; TASK-AT-313 nao substitui essa evidencia.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: reproduzir os 12 cenarios no runner oficial e preservar os artefatos somente quando houver falha.
- constraints: sem inferir validacao live, sem credenciais externas e sem promover rollout a partir desta evidencia local.
