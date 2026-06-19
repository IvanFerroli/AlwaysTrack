# TASK-AT-145 - Coverage HTML e gate documentado

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
- completed: 2026-06-19
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

## Resultado
Executada em 2026-06-19. Foi adicionado:
- script raiz `npm run coverage:html`;
- script `coverage:html` no workspace `@alwaystrack/api`;
- provider `@vitest/coverage-v8`;
- documentacao em `docs/testing/strategy.md` e `docs/architecture/testing-and-docs.md`;
- abertura/visibilidade do report em `npm run up` quando o HTML existir.

O gate formal por percentual ficou propositalmente fora do MVP para evitar falso bloqueio por codigo legado/default-off. O uso recomendado e como mapa de risco e apoio de onboarding.
