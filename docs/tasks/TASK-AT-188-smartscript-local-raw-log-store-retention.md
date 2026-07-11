# TASK-AT-188 - SmartScript: store local, TTL e retencao de raw logs

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-188-smartscript-local-raw-log-store-retention.md

## Modo
- mode: implementation

## Objetivo unico
Endurecer o armazenamento local de raw logs com TTL, purge pos-processamento, limite de tamanho, dedupe e metadata consultavel sem texto bruto.

## Contexto minimo
Captura real pode gerar volume e duplicatas. O store local precisa ser seguro antes de transformar eventos reais em candidatos.

## Inputs
- `TASK-AT-184`
- `TASK-AT-186`
- `apps/smartscript-companion/src/storage.ts`

## Dependencias
- satisfeitas: `TASK-AT-184`, `TASK-AT-186`.
- em aberto: politica final de TTL/tamanho.

## Alvos explicitos
1. `apps/smartscript-companion/src/storage.ts`
2. `apps/smartscript-companion/src/cli.ts`
3. testes do companion

## Fora de escopo
- Criptografia enterprise de disco.
- Upload remoto de logs brutos.
- UI web historica de raw logs.

## Checklist
1. Implementar limite de tamanho por dia.
2. Dedupe por hash/event id.
3. Purge automatico por TTL.
4. Purge opcional apos processamento bem-sucedido.
5. Metadata de diagnostico sem texto bruto.
6. Tolerancia a interrupcao durante escrita.

## Acceptance Criteria
1. Store nao cresce indefinidamente.
2. Processamento nao reimporta duplicatas obvias.
3. Purge nao apaga candidatos processados.
4. Status mostra storage/TTL/contagens sem conteudo.

## Definition of Done
1. Store robustecido.
2. Testes cobrem TTL, dedupe e limite de tamanho.
3. Docs atualizadas.

## Validacao
- comandos/checks: testes do companion, smoke `status`.
- revisao manual: criar eventos repetidos e conferir contagem.

## Evidencia esperada
- Saida dos testes.
- Exemplo de metadata local redigida.

## Riscos
- Apagar antes de processar.
- Dedupe remover exemplos uteis.

## Blockers possiveis
- Necessidade de lock cross-process.

## Retorno esperado
- resumo do store
- evidencias de validacao
- riscos residuais
- proximo passo recomendado
