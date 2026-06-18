# TASK-AT-121 - npm run up como bancada completa de estudo

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-121-local-up-full-study-workbench.md

## Modo
- mode: ops

## Capability
- Operacao local, onboarding tecnico e apresentacao.

## Origem documental
- Pedido do usuario em 2026-06-18: ao rodar `npm run up`, instalar dependencias, executar setup local, subir app e abrir no navegador tudo que ajude a estudar/apresentar.
- Continuidade de `TASK-AT-118`, `TASK-AT-117`, `TASK-AT-120` e frente de performance/testes.

## Objetivo unico
Atualizar `npm run up` para virar uma bancada local automatizada: instala dependencias, prepara banco/seed/docs, sobe API/Web/Prisma Studio, dispara smoke de carga opcional e abre no navegador app, Prisma, docs, testes, coverage/reportes existentes e performance.

## Contexto minimo
`scripts/start-all.js` ja prepara banco, gera TypeDoc, sobe API/Web/Studio e abre alguns arquivos. Ainda faltam:
- rodar `npm install` antes do setup;
- expor melhor os artefatos de estudo no browser;
- abrir coverage quando existir;
- abrir reportes Playwright/performance quando existirem;
- executar smoke de carga local de forma segura, sem bloquear startup;
- documentar flags para desligar partes pesadas.

## Inputs
- `package.json`
- `scripts/start-all.js`
- `scripts/perf-report.js`
- `docs/architecture/testing-and-docs.md`
- `docs/performance/README.md`
- `docs/testing/strategy.md`

## Dependencias satisfeitas
- `npm run setup` ja existe.
- TypeDoc ja existe via `npm run docs:api`.
- Artillery ja existe via `perf:smoke:report`.
- Prisma Studio ja e iniciado no `up`.

## Dependencias em aberto
- Coverage HTML so pode abrir se ja existir; esta task nao deve instalar plugin de coverage novo.
- Playwright report so abre se ja existir.

## Alvos explicitos
1. `npm run up` executa `npm install` antes do setup local, com flag para pular.
2. `npm run up` prepara banco/seed/docs como hoje.
3. `npm run up` abre automaticamente Web, API health, Prisma Studio, TypeDoc, docs de testes, docs de performance, reports Playwright/coverage/performance quando existirem.
4. `npm run up` pode rodar smoke de carga local em background depois dos servicos subirem, com flag para pular.
5. `npm run setup` continua funcionando sem subir servicos.
6. Flags documentadas no proprio script/runbook.

## Fora de escopo
- Criar coverage tooling novo.
- Rodar `perf:1000` localmente.
- Garantir que todo navegador/OS abra todos os arquivos; abertura e best-effort.
- Criar UI nova para docs.

## Checklist
1. Adicionar `--skip-install`, `--no-perf-smoke`, `--no-open`, `--no-studio`, `--no-docs`.
2. Setar senha seed local deterministica quando ausente para smoke/performance local.
3. Rodar `npm install` com log claro.
4. Manter setup local idempotente.
5. Subir API/Web/Studio.
6. Esperar health da API antes do smoke de carga.
7. Executar `node scripts/perf-report.js smoke --target=http://localhost:3333` em background.
8. Abrir reports existentes e reabrir report de performance quando gerado.
9. Atualizar docs de testing/onboarding.

## Acceptance Criteria
1. `npm run up -- --setup-only --skip-install --no-docs` continua preparando banco sem subir app.
2. `npm run up -- --skip-install --no-open --no-perf-smoke` sobe API/Web/Studio sem tentar abrir browser nem rodar carga.
3. Com `--no-perf-smoke` ausente, smoke local e disparado depois do health da API.
4. A lista de URLs/arquivos abertos fica visivel no terminal.
5. Falha ao abrir navegador/report nao derruba o app.

## Definition of Done
1. Script atualizado.
2. Docs atualizadas.
3. EXEC criado com evidencias.
4. Validações locais registradas.

## Validacao
- `npm run up -- --setup-only --skip-install --no-docs`
- `node --check scripts/start-all.js`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Evidencia esperada
- Output de setup-only passando.
- Documentacao listando flags.
- EXEC com o que abre no navegador e o que e best-effort.

## Riscos
- `npm install` deixa o `up` mais lento.
- Smoke de carga pode falhar se porta/API nao subir; deve ser nao destrutivo e logado.
- Abrir muitas abas pode incomodar; `--no-open` deve desligar.

## Proximo passo provável
Executar `TASK-AT-122` para revisar lacunas de testes/docs recentes.
