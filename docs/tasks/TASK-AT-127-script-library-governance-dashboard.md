# TASK-AT-127 - Scriptoteca: painel de governanca

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-127-script-library-governance-dashboard.md

## Modo
- mode: governance

## Objetivo unico
Criar uma visao gerencial para Supervisor/Admin priorizar revisoes, scripts vencidos, duplicados provaveis, sugestoes abertas, scripts sem uso e buscas sem resultado.

## Contexto
As metricas ja existem, mas ainda ficam misturadas na tela operacional. Para maturidade de produto, a Scriptoteca precisa mostrar o que deve ser mantido, revisado ou descartado.

## Escopo funcional
1. Separar bloco "Gestao da Scriptoteca" ou aba de governanca.
2. Cards acionaveis para revisao vencida, sugestoes pendentes, sem uso e buscas sem resultado.
3. Lista de possiveis duplicados por titulo/tags/categoria.
4. Filtros aplicados ao clicar nos cards.

## Acceptance Criteria
1. Admin entende rapidamente onde agir.
2. Cards levam para filtros reais.
3. Nao expor texto sensivel de atendimento em metricas.
4. Funciona sem dados, com empty states bons.

## Riscos
- Dedupe semantico pode crescer demais; comecar por heuristica simples.
