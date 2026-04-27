# TASK-SCR-019 - Coletor RSS generico por seed list

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-019-coletor-rss-generico-por-seed-list.md

## Modo
- mode: runtime

## Objetivo unico
Expandir cobertura rapidamente com coletor RSS generico que suporte multiplos feeds publicos configurados por seed list.

## Contexto minimo
A estrategia por fonte dedicada funciona, mas escalabilidade de cobertura pede um caminho rapido para onboard de feeds RSS de carreiras sem novo parser por site.

## Inputs
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: curadoria inicial de seed list confiavel

## Alvos explicitos
1. Definir seed list de feeds RSS validos para vagas.
2. Implementar parser RSS generico com fallback seguro de campos.
3. Permitir uso da seed list em rodada unica de coleta.
4. Expor resultados agregados e por feed no report.

## Fora de escopo
- crawling fora de RSS;
- captura autenticada;
- dedupe semantico avancado.

## Checklist
1. Definir schema minimo (`title`, `company`, `url`, `postedAt`).
2. Tratar feeds com campo ausente sem quebrar rodada.
3. Cobrir fixture RSS multipla em teste deterministico.
4. Atualizar docs com formato de seed list.

## Acceptance Criteria
1. N feeds RSS podem ser processados na mesma rodada.
2. Parse minimo consistente para feeds heterogeneos.
3. Report evidencia delta de `ingested` por seed.

## Definition of Done
1. Coletor RSS reutilizavel para expansao de cobertura.
2. Processo de onboard de feed novo sem codigo adicional grande.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - rodar com seed list de exemplo e validar contadores por feed.

## Evidencia esperada
- fixture RSS multipla;
- report com detalhe por feed;
- docs de seed list e constraints.

## Riscos
- qualidade heterogenea dos feeds introduzir ruido;
- excesso de duplicata entre feeds similares.

## Blockers possiveis
- feeds instaveis ou com XML malformado;
- ausencia de campos obrigatorios em parte dos itens.

## Feedback obrigatorio de retorno
- qual ganho de volume util foi obtido com seed list inicial?
- quais regras minimas de qualidade de feed foram definidas para manter no baseline?
