# EXEC-AT-121 - npm run up como bancada completa de estudo

## Resultado
- status: completed
- date: 2026-06-18
- task: docs/tasks/TASK-AT-121-local-up-full-study-workbench.md

## Roteamento Olympus
- taskyfier_mode: pipeline kickoff
- orchestrator_mode: ops
- execution_mode: execution artifact mode

## Entrega
`npm run up` foi atualizado para servir como bancada local completa de estudo e apresentacao.

## Escopo coberto
1. `scripts/start-all.js` roda `npm install` antes do setup, salvo `--skip-install`/`--no-install`.
2. Senhas seed locais deterministicas sao definidas quando ausentes, permitindo login e smoke de carga local.
3. Setup local continua gerando Prisma Client, aplicando diff de schema, rodando seed e TypeDoc.
4. API, Web e Prisma Studio sobem como antes.
5. O navegador abre Web, API health, Prisma Studio, TypeDoc, docs de testes, docs de performance, runbooks/gates de seguranca, Playwright report, coverage e ultimo report de performance quando existirem.
6. Smoke Artillery local roda em background apos `/health` responder, salvo `--no-perf-smoke`.
7. Falhas de abertura de navegador/report ou smoke local nao derrubam os servicos principais.
8. Docs de testes, performance e arquitetura foram atualizadas.

## Flags
- `--skip-install` ou `--no-install`
- `--no-open`
- `--no-perf-smoke`
- `--no-studio`
- `--no-docs`
- `--setup-only`

## Validacao
- `node --check scripts/start-all.js`
- `npm run up -- --setup-only --skip-install --no-docs`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- Coverage HTML so abre se ja existir; plugin/gate de coverage dedicado fica como follow-up.
- Smoke local e diagnostico, nao evidencia de 1000 usuarios.
- Abrir muitas abas pode incomodar; usar `--no-open` para modo silencioso.
