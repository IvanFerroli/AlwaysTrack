# TASK-AT-380 - Metas, resultados e graficos de Campanhas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-380-sac-campaign-results-charts.md

## Modo
- mode: implementation

## Objetivo unico
Conectar campanhas a Performance aprovada e exibir evolucao contra meta por periodo/time, sem ranking nominal.

## Contexto minimo
Os graficos comerciais existentes podem fornecer estrutura responsiva, tooltip e tabela, mas valores monetarios, notas, vendedores e posicoes devem desaparecer.

## Dependencias
- satisfeitas: TASK-AT-376, TASK-AT-377 e TASK-AT-379.
- em aberto: n/a.

## Alvos explicitos
1. Servico de resultados e snapshots de campanha SAC.
2. Componentes neutros reutilizados/adaptados dos graficos atuais.
3. Visao de tendencia, meta, cobertura de dados e detalhe autorizado.

## Fora de escopo
- Ordenar pessoas do melhor ao pior.
- Misturar metricas com unidades diferentes em um score unico.

## Checklist
1. Calcular resultado somente de registros APPROVED no periodo/audiencia.
2. Mostrar meta, realizado, tendencia, denominador e cobertura.
3. Versionar snapshot quando necessario para fechamento auditavel.
4. Explicar recalculo causado por correcao aprovada.
5. Oferecer tabela acessivel e estados sem dado/parcial.

## Acceptance Criteria
1. Resultado reconcilia com a API de Performance para os mesmos filtros.
2. Correcao aprovada gera nova explicacao/revisao, nao rewrite silencioso.
3. Graficos nao exibem moeda, nota fiscal, vendedor, podium ou posicao.
4. Campanha encerrada possui resultado reproduzivel e provenance.

## Validacao
- comandos/checks: golden cases, testes de snapshot/recalculo, componentes e screenshots.
- revisao manual: campanha por CSAT, SLA, produtividade e ReclameAqui.

## Riscos
- Reaproveitar componente com formatter monetario ou label comercial escondida.

## Proximo passo provavel
TASK-AT-381

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: reuso visual com semantica e contratos SAC novos.
