# TASK-SCR-024 - Extrator JobPosting por JSON-LD em HTML

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-024-extrator-jobposting-por-jsonld-html.md

## Modo
- mode: runtime

## Objetivo unico
Criar metodo alternativo de coleta usando `schema.org/JobPosting` em JSON-LD para paginas de carreira sem API publica dedicada.

## Contexto minimo
Muitas paginas corporativas expõem JSON-LD mesmo sem endpoint de vagas. Esse caminho aumenta cobertura com baixo acoplamento a layout visual.

## Inputs
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/acquisition/acquisition.service.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: estrategia de fallback quando JSON-LD parcial

## Alvos explicitos
1. Detectar e extrair blocos JSON-LD de tipo `JobPosting`.
2. Normalizar payload para contrato canonico de vaga.
3. Integrar metodo `html-jsonld` no registro de fontes/metodos.
4. Cobrir testes com fixtures HTML reais e casos sem JSON-LD.

## Fora de escopo
- parser de DOM visual complexo por seletor CSS;
- crawling profundo entre varias paginas;
- suporte a microdata nao-JSON-LD neste ciclo.

## Checklist
1. Implementar extractor robusto para script JSON-LD.
2. Tratar arrays/objetos mistos de schema.
3. Manter rodada viva quando pagina nao tiver JSON-LD valido.
4. Expor metodo efetivo no report.

## Acceptance Criteria
1. JSON-LD valido gera vaga canonica aproveitavel.
2. ausencia/erro de JSON-LD nao derruba ciclo.
3. testes de fixture cobrem sucesso e degradacao.

## Definition of Done
1. Metodo `html-jsonld` operacional e testado.
2. Cobertura de paginas sem API aumenta com risco controlado.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - executar fonte de teste HTML e validar `method=html-jsonld` no report.

## Evidencia esperada
- fixtures HTML com JobPosting JSON-LD;
- testes de parser dedicados;
- report de rodada com metodo aplicado.

## Riscos
- JSON-LD incompleto gerar dados pobres de vaga;
- falso positivo em scripts nao relacionados.

## Blockers possiveis
- paginas relevantes sem JSON-LD padronizado;
- variacoes de schema fora do baseline suportado.

## Feedback obrigatorio de retorno
- qual ganho de cobertura veio especificamente de `html-jsonld`?
- quais campos mais faltaram nas paginas que usam esse metodo?
