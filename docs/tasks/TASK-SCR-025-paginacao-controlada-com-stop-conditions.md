# TASK-SCR-025 - Paginacao controlada por fonte com stop conditions

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-025-paginacao-controlada-com-stop-conditions.md

## Modo
- mode: runtime

## Objetivo unico
Aumentar cobertura por fonte habilitando paginacao controlada (`maxPages`) com condicoes de parada explicitas para conter custo e latencia.

## Contexto minimo
Sem paginacao, parte das fontes entrega apenas recorte da oferta. Com paginacao livre, risco de explosao de tempo/custo aumenta.

## Inputs
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/pipeline/pipeline.service.ts`
- `services/api/src/features/pipeline/pipeline.service.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018, TASK-RTM-003
- em aberto: tuning inicial de `maxPages` por fonte

## Alvos explicitos
1. Implementar `maxPages` por fonte com configuracao padrao segura.
2. Definir stop conditions (`empty-page`, `high-duplicate-rate`, `duration-limit`).
3. Expor `pagesVisited` e `stopReason` por fonte no report.
4. Garantir compatibilidade com guardrails de budget atuais.

## Fora de escopo
- historico completo retroativo;
- coleta sem limite;
- mudanca de logica de match/ranking.

## Checklist
1. Adicionar params de paginacao no registro canonico de fontes.
2. Integrar stop conditions no loop de coleta.
3. Cobrir testes multi-page com mock deterministico.
4. Validar degradacao segura em `source=all`.

## Acceptance Criteria
1. cobertura de fonte paginada aumenta sem violar limite de duracao.
2. report evidencia claramente quantas paginas foram visitadas e por que parou.
3. testes cobrem paradas esperadas e continuam estaveis.

## Definition of Done
1. Paginacao previsivel e observavel por fonte.
2. Guardrails de custo/tempo continuam ativos e verificaveis.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/pipeline/pipeline.service.test.ts`
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - executar fonte paginada e confirmar `pagesVisited`/`stopReason`.

## Evidencia esperada
- testes multi-page;
- report com metrica de paginacao;
- comparativo antes/depois de cobertura por fonte.

## Riscos
- `maxPages` alto demais gerar rodada lenta;
- regra de stop conservadora demais reduzir ganho esperado.

## Blockers possiveis
- fontes sem parametros de paginacao estaveis;
- dificuldade de simular duplicata alta em teste.

## Feedback obrigatorio de retorno
- qual valor inicial de `maxPages` ficou por fonte critica?
- qual stop condition mais acionou no piloto?
