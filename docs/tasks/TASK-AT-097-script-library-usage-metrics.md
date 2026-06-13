# TASK-AT-097 - Scriptoteca: metricas de uso e lacunas

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-097-script-library-usage-metrics.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.9
- dependencias: `TASK-AT-092`, `TASK-AT-091`

## Objetivo unico
Medir uso da Scriptoteca para revelar scripts mais copiados, nunca usados e buscas sem resultado.

## Escopo funcional
1. Evento de copia por script. Status: entregue.
2. Evento de busca com zero resultado. Status: pendente.
3. Indicadores: mais copiados, nunca usados, desatualizados ha X dias, buscas sem resultado. Status: parcial.
4. Painel simples para Supervisor/Admin. Status: pendente.
5. Export ou resumo se for util. Status: pendente.

## Acceptance Criteria
1. Copias geram metrica sem expor texto sensivel.
2. Buscas sem resultado aparecem agregadas.
3. Supervisor/Admin identifica lacunas de script.
4. Metrica nao atrapalha o fluxo de atendimento.
5. Dados antigos podem ser paginados ou limitados.

## Riscos
- Coletar conteudo de atendimento indevido.
- Transformar metrica em vigilancia individual em vez de melhoria operacional.

## Execucao parcial
- `usageCount` e eventos de copia ja existem para alimentar metricas futuras.
- Proxima rodada deve agregar lacunas e buscas sem resultado sem expor texto sensivel.
