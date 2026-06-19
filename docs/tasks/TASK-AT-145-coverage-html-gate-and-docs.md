# TASK-AT-145 - Coverage HTML e gate documentado

## Metadata
- status: proposed
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-145-coverage-html-gate-and-docs.md

## Objetivo
Padronizar relatorio HTML de coverage e uma regra minima de gate para evitar regressao invisivel nos fluxos centrais.

## Escopo
1. Confirmar ferramenta de coverage usada pelos workspaces.
2. Criar script raiz `coverage:html` se ainda nao existir.
3. Fazer `npm run up` abrir coverage quando gerado.
4. Documentar como interpretar coverage por modulo.
5. Definir gates iniciais sem bloquear desenvolvimento por falso negativo.

## Criterios de Aceite
1. Coverage HTML pode ser gerado localmente com um comando raiz.
2. O report abre no navegador ou aparece no workbench local.
3. Docs explicam que cobertura baixa em arquivo legado nao e igual a risco ativo.

