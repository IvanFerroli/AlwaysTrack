# TASK-AT-362 - Contrato de aposentadoria e compatibilidade SAC

## Metadata
- status: proposed
- pipeline: BLOCKED_BY_DECISION
- classified-by: olympus-taskyfier run #2 (2026-09-03) — audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, seção K.1: a cadeia 362/365/381 assume sunset de Vendas e só pode ser ratificada/ajustada pela decisão humana de `TASK-AT-454` (finding `ATUX-001`); não executar antes
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-362-sac-retirement-compatibility-contract.md

## Modo
- mode: planning

## Objetivo unico
Fixar a arquitetura, os invariantes de dados e o contrato de sunset que governarao a retirada de Vendas e a entrada das superficies SAC.

## Contexto minimo
Notas, ranking, extratos, campanhas, dashboard, roles e rotas estao acoplados a `Sales*`. Um simples rename perderia semantica e poderia converter historico comercial em dado SAC incorreto.

## Dependencias
- satisfeitas: TASK-AT-361 e inventario atual de codigo/documentos.
- em aberto: n/a.

## Alvos explicitos
1. ADR de aposentadoria comercial e fronteiras SAC.
2. Matriz rota/view/modelo/job/role: manter, congelar, adaptar ou retirar.
3. Contrato de deprecacao, sunset, exportacao e rollback.

## Fora de escopo
- Alterar schema ou runtime.
- Escolher delete como estrategia de limpeza.

## Checklist
1. Inventariar referencias a sales, vendas, notas, ranking, extratos, vendedor e financeiro.
2. Classificar dados legados, consumidores e dependencias de jobs/seed/testes.
3. Definir comportamento de cada rota antiga e flags de compatibilidade.
4. Definir destino de usuarios ativos com roles legadas sem migracao implicita.
5. Definir timezone, granularidade de periodo e ownership dos novos dominios SAC.

## Acceptance Criteria
1. Nenhum modelo ou registro comercial fica sem destino explicito.
2. Escrita antiga, leitura historica, exportacao e sunset possuem comportamento e owner definidos.
3. O contrato proibe mapear `VENDEDOR` para `SAC`, `SalesGroup` para time SAC ou ranking para performance automaticamente.
4. Rollback preserva os dois dominios e nao depende de downgrade destrutivo.

## Validacao
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisao manual: cruzar app.ts, schema Prisma, navegacao Web, matriz de permissao, jobs, seed e OpenAPI.

## Riscos
- Deixar uma superficie indireta ativa em busca, notificacao, ajuda, CSV ou deep link.

## Proximo passo provavel
TASK-AT-363

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: aprovar o contrato antes de qualquer migracao ou rename.
