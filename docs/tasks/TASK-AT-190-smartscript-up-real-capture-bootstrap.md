# TASK-AT-190 - SmartScript: bootstrap de captura real no npm run up

## Metadata
- status: planned
- owner: olympus_orchestrator
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-190-smartscript-up-real-capture-bootstrap.md

## Modo
- mode: implementation

## Objetivo unico
Fazer `npm run up` deixar o logger real ativo de forma visivel, com opt-out claro e sem confundir fixture demo com captura real.

## Contexto minimo
O `up` ja prepara companion, Espanso e demo. Com captura real, o output precisa dizer exatamente o que esta ativo, degradado ou desativado.

## Inputs
- `TASK-AT-184`
- `TASK-AT-189`
- `scripts/start-all.js`
- `package.json`

## Dependencias
- satisfeitas: `TASK-AT-184`, `TASK-AT-189`.
- em aberto: comando final do logger real.

## Alvos explicitos
1. `scripts/start-all.js`
2. `package.json`
3. `apps/smartscript-companion/src/cli.ts`
4. docs/runbook SmartScript

## Fora de escopo
- Instalador permanente do Windows.
- Capturar sem consentimento operacional.
- Rodar captura em producao multiusuario.

## Checklist
1. `npm run up` inicia logger real quando ambiente suporta.
2. Mostrar status claro: ativo, pausado, degradado, indisponivel.
3. Manter `--no-smartscript`.
4. Manter `--no-smartscript-demo`.
5. Adicionar opt-out especifico de captura real se necessario.
6. Encerrar processos no `Ctrl+C`.
7. Espanso continua preparado como runtime/export.

## Acceptance Criteria
1. Um unico `npm run up` deixa logging real pronto quando dependencias existem.
2. Falha de captura nao derruba API/Web.
3. Demo nao e apresentada como captura real.
4. Opt-outs aparecem no output.

## Definition of Done
1. Startup integrado.
2. Smoke local documentado.
3. Runbook atualizado.

## Validacao
- comandos/checks: `node --check scripts/start-all.js`, smoke `npm run up -- --skip-install --no-open --no-studio --no-docs --no-perf-smoke`.
- revisao manual: encerrar e confirmar portas/processos limpos.

## Evidencia esperada
- Output do `up`.
- Status do companion.
- Lista de flags.

## Riscos
- Captura iniciar sem o usuario perceber.
- Bootstrap mascarar erro real.

## Blockers possiveis
- Adapter exigir processo persistente separado.

## Retorno esperado
- resumo do bootstrap
- evidencias de validacao
- flags disponiveis
- proximo passo recomendado
