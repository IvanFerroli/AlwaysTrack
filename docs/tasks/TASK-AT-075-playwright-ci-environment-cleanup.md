# TASK-AT-075 - Playwright/CI limpo

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-075-playwright-ci-environment-cleanup.md

## Fase
- fase: B - Confiabilidade operacional
- prioridade: 7
- dependencias: suite Playwright existente.

## Objetivo unico
Deixar smoke/e2e Playwright rodando limpo no ambiente de validacao/CI ou documentar causa, impacto e solucao quando houver limitacao local.

## Contexto
O ambiente local atual falhou ao abrir Chromium por `libnspr4.so` ausente. Para vender maturidade tecnica, os testes de jornada precisam estar confiaveis.

## Escopo tecnico
1. Diagnosticar dependencia ausente local e instrucoes de instalacao.
2. Validar CI com browsers/dependencias corretas.
3. Separar smoke rapido de suites longas.
4. Documentar como reproduzir e interpretar falhas.
5. Garantir artefatos de trace/screenshot em falhas reais.

## Arquivos candidatos
- `playwright.config.ts`
- `.github/workflows/**`
- `scripts/start-e2e.js`
- `tests/e2e/**`
- `docs/testing/**` ou `docs/architecture/**`

## Plano de execucao
1. Rodar diagnostico `npx playwright install-deps`/equivalente documentado.
2. Ajustar CI para instalar dependencias de browser.
3. Criar script smoke dedicado se necessario.
4. Garantir seed/test server previsivel.
5. Atualizar docs de validacao.

## Acceptance Criteria
1. CI executa ao menos smoke Playwright sem falha ambiental.
2. Falha local `libnspr4.so` tem causa e solucao documentadas.
3. Comando de smoke e claro e rapido.
4. Artefatos de falha continuam disponiveis.
5. Nao mistura falha de ambiente com regressao de produto.

## Impacto na apresentacao
Ajuda a provar maturidade tecnica e reduz medo de regressao.

## Riscos
- Resolver dependencias locais pode variar por distro.
- Suite longa pode ficar instavel se misturar muitos fluxos.

