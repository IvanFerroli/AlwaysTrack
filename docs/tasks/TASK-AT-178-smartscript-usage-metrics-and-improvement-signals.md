# TASK-AT-178 - SmartScript: metricas de uso e melhoria continua

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-178-smartscript-usage-metrics-and-improvement-signals.md

## Modo
- mode: implementation

## Objetivo unico
Medir uso e qualidade do ciclo SmartScript sem transformar a ferramenta em vigilancia individual pesada.

## Contexto minimo
O MVP deve medir uso dos snippets, candidatos gerados/aprovados/rejeitados/exportados e sinais uteis para melhorar biblioteca pessoal e operacional.

## Inputs
- `TASK-AT-171`
- `TASK-AT-177`
- metricas existentes da Scriptoteca

## Dependencias
- satisfeitas: `TASK-AT-171`, `TASK-AT-177`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/script-library/`
2. `apps/web/src/views/script-library.tsx`
3. painel de governanca/metricas da Scriptoteca

## Fora de escopo
- Ranking individual punitivo.
- Analytics externo.
- Capturar conteudo bruto usado no Espanso.

## Checklist
1. Registrar candidatos gerados, aprovados, rejeitados, revisados e exportados.
2. Registrar uso/copia/acionamento quando disponivel sem armazenar raw text.
3. Separar metricas de snippets pessoais SmartScript e scripts canonicos.
4. Exibir sinais de melhoria: muito rejeitado, muito usado, pronto para canonizar.
5. Preservar escopo por usuario/organizacao.

## Acceptance Criteria
1. Gestor ve saude agregada do SmartScript sem acessar raw logs.
2. Atendente ve seus snippets mais usados/exportados.
3. Metricas nao misturam `OperationalScript` com snippet pessoal sem indicacao.
4. Eventos de uso nao persistem dados sensiveis.

## Definition of Done
1. Metricas backend implementadas.
2. UI ou painel simples conectado.
3. Testes de agregacao e escopo.

## Validacao
- comandos/checks: testes API de metricas, typecheck web/api.
- revisao manual: gerar uso fake/fixture e conferir agregados.

## Evidencia esperada
- Saida de agregados.
- Print ou descricao da visualizacao.

## Riscos
- Metricas virarem ruido operacional.
- Expor informacao pessoal demais.

## Blockers possiveis
- Definir como contar acionamento real do Espanso no MVP.

## Retorno esperado
- resumo das metricas
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue endpoint de metricas SmartScript com resumo, usos, exports, batches e sinais de canonizacao.
- Entregue registro de uso para snippet `Em uso`.
- Aba SmartScript exibe metricas e listas de snippets mais usados/prontos para canon.
