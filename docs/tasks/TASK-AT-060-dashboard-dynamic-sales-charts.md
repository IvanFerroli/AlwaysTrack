# TASK-AT-060 - Dashboard dynamic sales charts

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-060-dashboard-dynamic-sales-charts.md

## Modo
- mode: dashboard-analytics

## Objetivo unico
Adicionar grafico dinamico no dashboard comercial, respeitando range/filtros escolhidos e usando dados reais de notas aprovadas.

## Contexto minimo
Para apresentar como produto acabado, o dashboard precisa mostrar tendencia visual de vendas, nao apenas cards/tabelas. O grafico deve responder ao periodo selecionado e ajudar gestor/supervisor a entender evolucao.

## Inputs
- Range padrao desejado: hoje, 7 dias, 30 dias, mes atual ou customizado.
- Nivel inicial: total geral, por vendedor, por grupo ou todos.

## Dependencias
- satisfeitas: notas, ranking, extratos e filtros comerciais existem.
- em aberto: confirmar biblioteca de grafico ou implementar com componente leve existente.

## Alvos explicitos
1. Criar endpoint/contrato de serie temporal do dashboard.
2. Agregar valor aprovado, quantidade de notas e ticket medio por periodo.
3. Respeitar filtros combinados: data, vendedor, grupo e status quando aplicavel.
4. Renderizar grafico responsivo no dashboard.
5. Mostrar estados vazio/carregando/erro.
6. Adicionar testes para agregacao por range.

## Fora de escopo
- BI completo.
- Drill-down complexo por produto/item.
- Comparacao ano contra ano nesta primeira versao.

## Checklist
1. Definir buckets: dia/semana/mes conforme range.
2. Implementar query/servico agregado.
3. Criar componente visual com tooltip/legenda.
4. Integrar filtros existentes.
5. Validar com seed de 3 vendedores.

## Acceptance Criteria
1. Alterar range muda os dados do grafico.
2. Filtro por vendedor/grupo altera a serie.
3. Grafico nao quebra quando nao ha vendas aprovadas.
4. Valores batem com ranking/extratos para o mesmo periodo.

## Definition of Done
1. Dashboard exibe grafico util e responsivo.
2. Agregacao testada.
3. `npm run test:all` e build web passam.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- dashboard.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run test:all`
- revisao manual: trocar range/vendedor/grupo e comparar totais.

## Evidencia esperada
- Print do grafico com dados.
- Resultado de teste de agregacao por periodo.

## Riscos
- Grafico pode induzir erro se misturar status pendente com aprovado.
- Query agregada sem indice pode pesar em base grande.

## Blockers possiveis
- Falta de dados aprovados suficientes para validar visualmente.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
