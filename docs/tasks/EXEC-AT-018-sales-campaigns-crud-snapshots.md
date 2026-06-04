# EXEC-AT-018 - Sales campaigns CRUD and ranking snapshots

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-018-sales-campaigns-crud-snapshots.md

## Objetivo
Transformar Campanhas de uma lista read-only em controle operacional para configurar campanhas comerciais e congelar rankings historicos.

## Entregue
- `AT-019B` entregue como MVP dentro de `TASK-AT-019`.
- API para criar e editar campanhas comerciais.
- API para gerar snapshots de ranking por campanha.
- API para listar snapshots recentes.
- Escopo preservado por organizacao e por supervisor.
- Auditoria para criacao/edicao de campanha e snapshot de ranking.
- Tela de Campanhas com formulario de criacao/edicao, ativar/pausar e botao de snapshot.
- Tabela de snapshots recentes com campanha, escopo, periodo, posicoes e data.

## Validacao
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts` — passou; 14 testes.
- `npm run typecheck --workspace @alwaystrack/api` — passou.
- `npm run typecheck --workspace @alwaystrack/web` — passou.
- `npm run build --workspace @alwaystrack/web` — passou.
- `npm run check` — passou; 145 testes.

## Residual
- Filtro visual por vendedor no ranking.
- Tela analitica para comparar snapshots historicos.
- CRUD de grupos/vendedores dedicado para alimentar seletores com mais liberdade.
