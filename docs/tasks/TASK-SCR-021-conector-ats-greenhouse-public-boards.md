# TASK-SCR-021 - Conector ATS Greenhouse (public boards)

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-021-conector-ats-greenhouse-public-boards.md

## Modo
- mode: runtime

## Objetivo unico
Adicionar conector dedicado para boards publicos Greenhouse com normalizacao canonica de origem e falha parcial controlada.

## Contexto minimo
Greenhouse concentra vagas de varias empresas tech e representa ganho direto de diversidade de oportunidades no funil.

## Inputs
- `services/api/src/features/acquisition/ats-adapters.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: cobertura de variacoes de endpoint por tenant

## Alvos explicitos
1. Implementar fetch/parse para Greenhouse public board.
2. Normalizar `sourceName` e metadados minimos de vaga.
3. Integrar ao `source=all` com resiliencia de falha parcial.
4. Cobrir fixture e contrato de parser em teste.

## Fora de escopo
- scraping autenticado;
- bypass de protecao de fornecedor;
- suporte a todas variacoes nao publicas.

## Checklist
1. Definir formato esperado de payload Greenhouse.
2. Implementar parser resiliente a campos opcionais.
3. Garantir dedupe compativel com ingestion atual.
4. Atualizar matriz de fontes na documentacao.

## Acceptance Criteria
1. `source=greenhouse` retorna vagas validas em teste deterministico.
2. `source=all` nao quebra em falha isolada da fonte.
3. `sourceReports` exibe contadores da fonte corretamente.

## Definition of Done
1. Greenhouse operacional no baseline de coleta.
2. Contrato da fonte protegido por testes.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - rodar fonte isolada e validar payload normalizado.

## Evidencia esperada
- parser/adaptador Greenhouse;
- fixture de payload realista;
- report com `sourceName=Greenhouse`.

## Riscos
- variacoes de endpoint por tenant causarem falsos negativos;
- duplicata com agregadores ja conectados.

## Blockers possiveis
- endpoint publico indisponivel no ambiente;
- schema mudar sem aviso.

## Feedback obrigatorio de retorno
- Greenhouse entrou em `auto` ou `fallback` no final?
- qual volume medio util por rodada foi observado apos ativacao?
