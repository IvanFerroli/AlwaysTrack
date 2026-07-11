# TASK-AT-189 - SmartScript: pipeline de eventos reais para candidatos

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-189-smartscript-live-events-to-candidates-pipeline.md

## Modo
- mode: implementation

## Objetivo unico
Transformar eventos reais capturados em batches locais, candidatos sanitizados e importacao idempotente para o AlwaysTrack.

## Contexto minimo
O processamento atual funciona com fixture. Esta task troca o centro de gravidade para eventos reais, mantendo limite de 10 candidatos e raw logs locais.

## Inputs
- `TASK-AT-175`
- `TASK-AT-176`
- `TASK-AT-188`
- endpoints SmartScript existentes

## Dependencias
- satisfeitas: `TASK-AT-175`, `TASK-AT-176`, `TASK-AT-188`.
- em aberto: identificador estavel de lote real.

## Alvos explicitos
1. `apps/smartscript-companion/src/processor.ts`
2. `apps/smartscript-companion/src/cli.ts`
3. `apps/smartscript-companion/src/storage.ts`
4. testes API se import for tocado

## Fora de escopo
- Aprovar snippets automaticamente.
- Canonizacao automatica.
- Provider externo obrigatorio.

## Checklist
1. Criar batch local a partir de eventos reais.
2. Processar ate 10 candidatos.
3. Sanitizar antes de import.
4. Evitar reimportar lote ja enviado.
5. Manter rollover de `Gerados hoje` para `Em revisão`.
6. Falhar claramente sem sessao/API.
7. Registrar metadata local sem raw remoto.

## Acceptance Criteria
1. Eventos reais permitidos viram candidatos em `Gerados hoje`.
2. Rodar duas vezes nao cria duplicata indevida.
3. AlwaysTrack recebe apenas candidatos sanitizados.
4. Usuario ainda revisa/aprova manualmente.

## Definition of Done
1. Pipeline real implementado.
2. Testes cobrem idempotencia e ausencia de raw remoto.
3. Runbook atualizado.

## Validacao
- comandos/checks: testes do companion, testes API SmartScript relevantes.
- revisao manual: capturar, processar/importar e abrir `Scriptoteca > SmartScript`.

## Evidencia esperada
- Contagem de eventos reais.
- Contagem de candidatos importados.
- Confirmacao de rawLogsRemote false.

## Riscos
- Candidatos ruins por ruido.
- Sanitizacao remover contexto util.

## Blockers possiveis
- Falta de lote estavel para idempotencia.

## Retorno esperado
- resumo do pipeline
- evidencias de validacao
- riscos residuais
- proximo passo recomendado
