# TASK-AT-144 - Workbench local: indice navegavel de reports

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-144-report-index-and-browser-workbench-hardening.md

## Objetivo
Transformar `npm run up` em um hub ainda mais didatico, com indice navegavel dos ultimos reports de performance, Playwright, coverage, TypeDoc e docs operacionais.

## Contexto
`scripts/start-all.js` ja abre app, API health, Prisma Studio, TypeDoc, docs e ultimo report HTML de performance quando existe. O proximo ganho e gerar uma pagina de indice mais rica, com historico dos ultimos N reports e status visual por categoria.

## Plano
1. Listar ultimos 5 reports HTML/Markdown de `docs/performance/reports`.
2. Mostrar links para logs/JSON diagnosticos quando existirem.
3. Mostrar estado de coverage/Playwright: disponivel, ausente ou desatualizado.
4. Abrir esse indice como primeira aba local.
5. Documentar flags `--no-open`, `--no-docs`, `--no-perf-smoke`, `--skip-install`.

## Criterios de Aceite
1. `npm run up` gera uma pagina HTML local com todos os reports navegaveis.
2. Nao quebra execucao quando um report esta ausente.
3. O indice diferencia report atual de historico.
4. Documentacao de uso fica em `docs/testing` ou `docs/operations`.

## Riscos
- Abrir abas demais pode atrapalhar; manter a pagina indice como hub principal e abrir reports individuais apenas quando forem gerados.

## Resultado
Executada em 2026-06-19. `npm run up` agora gera uma bancada local com:
- historico dos ultimos reports de performance;
- links para HTML, resumo, JSON, log e diagnosticos antes/depois quando existem;
- status visual de Playwright e coverage;
- indicacao clara de artefato ausente sem quebrar startup.
