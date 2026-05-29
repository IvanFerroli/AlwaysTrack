# TASK-AT-011 - Beta local smoke

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-011-beta-local-smoke.md

## Modo
- mode: verification

## Objetivo unico
Criar um smoke local automatizado que valide o minimo de beta controlado depois de setup.

## Contexto minimo
O gate de beta exige checks manuais recorrentes. Um comando unico ajuda a detectar quebra de env, seed, login, dashboard e wiki antes de publicar um commit.

## Inputs
- `scripts/check-env.js`
- `scripts/start-all.js`
- `services/api/src/main.ts`
- `package.json`

## Dependencias
- satisfeitas: seed local, API Express, endpoints de auth/dashboard/wiki
- em aberto: smoke browser real

## Alvos explicitos
1. Script `scripts/smoke-beta-local.js`.
2. Script npm `smoke:beta-local`.
3. Validar env local e production sintetico.
4. Rodar setup com seed estavel.
5. Subir API local e testar health, login, me, dashboard e wiki.

## Fora de escopo
- Provisionar beta externo.
- Rodar Playwright/browser.
- Testar providers Meta/Google reais.

## Checklist
1. Criar script de smoke. Status: completed.
2. Registrar comando no `package.json`. Status: completed.
3. Atualizar gate beta com o comando. Status: completed.

## Acceptance Criteria
1. `npm run smoke:beta-local` falha se login, dashboard ou wiki quebrar.
2. O comando usa senha de seed estavel durante a propria execucao.
3. O processo da API e encerrado ao final.

## Validacao
- comandos/checks: `npm run smoke:beta-local`, `npm run check`
- revisao manual: conferir saida `[smoke:beta-local] ok`

## Riscos
- O smoke mexe no banco local via `npm run setup`; nao deve ser usado contra base real.
