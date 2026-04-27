# TASK-SCR-022 - Conector ATS Lever (public postings)

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-022-conector-ats-lever-public-postings.md

## Modo
- mode: runtime

## Objetivo unico
Adicionar conector dedicado para Lever public postings com parse estavel e dedupe preservado.

## Contexto minimo
Lever e fonte recorrente de vagas remotas e de produto/engenharia; cobertura nativa aumenta alcance sem depender de replicacao em agregadores.

## Inputs
- `services/api/src/features/acquisition/ats-adapters.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: normalizacao final de campos de localizacao

## Alvos explicitos
1. Implementar parser Lever com campos minimos canonicos.
2. Integrar conector no registro de fontes/metodos.
3. Garantir compatibilidade de dedupe com fluxo atual.
4. Cobrir sucesso/falha parcial em teste.

## Fora de escopo
- variacoes privadas de integracao Lever;
- scraping autenticado;
- enriquecimento LLM neste ciclo.

## Checklist
1. Mapear campos padrao do posting publico.
2. Tratar dados ausentes sem quebrar ingestao.
3. Adicionar testes com fixture Lever.
4. Atualizar documentacao da matriz operacional.

## Acceptance Criteria
1. `source=lever` coleta e normaliza vagas com consistencia.
2. dedupe segue funcional no cenario repetido.
3. falha da fonte nao derruba rodada completa.

## Definition of Done
1. Fonte Lever operacional e testada.
2. Report de rodada inclui dados confiaveis da fonte.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - executar `source=lever` e validar `sourceReports`/ingestao.

## Evidencia esperada
- fixture de posting Lever;
- teste de parser/runner passando;
- contadores da fonte no report.

## Riscos
- schema variar por tenant de forma relevante;
- qualidade de dados de localizacao inconsistente.

## Blockers possiveis
- endpoint publico com throttling no ambiente;
- falta de exemplos para edge cases criticos.

## Feedback obrigatorio de retorno
- qual estabilidade do conector Lever foi observada em rodadas repetidas?
- houve impacto relevante de dedupe com outras fontes apos ativacao?
