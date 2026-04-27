# TASK-QLT-005 - Harness de qualidade por contratos de scraping

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-QLT-005-harness-contratos-scraping-por-fonte.md

## Modo
- mode: quality

## Objetivo unico
Blindar expansao de fontes/metodos com suite de contratos de scraping por fonte para evitar regressao silenciosa de parser e integracao.

## Contexto minimo
A ambicao de cobertura maior aumenta superficie de quebra. Sem baseline de qualidade por fonte, regressao pode passar despercebida mesmo com testes gerais verdes.

## Inputs
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/fixtures/`
- `docs/runbooks/README.md`
- `docs/specs/SPEC-003-job-scraping.md`

## Dependencias
- satisfeitas: TASK-QLT-003
- em aberto: consolidacao progressiva de fixtures das novas fontes (TASK-SCR-019..025)

## Alvos explicitos
1. Definir contrato minimo por fonte/metodo (campos obrigatorios e comportamento de erro).
2. Versionar fixtures realistas por fonte ativa.
3. Introduzir thresholds de qualidade por fonte (parse success, ingest success, timeout).
4. Integrar gate no fluxo de quality (`npm run check`).

## Fora de escopo
- monitoramento cloud em tempo real;
- benchmark de larga escala fora do repo;
- substituicao completa do smoke.

## Checklist
1. Criar matriz de contrato por fonte/metodo.
2. Cobrir cenarios de sucesso, parcial e falha controlada.
3. Definir thresholds iniciais com justificativa.
4. Documentar processo de recalibracao com evidencia obrigatoria.

## Acceptance Criteria
1. regressao relevante por fonte quebra a suite de contrato.
2. thresholds ficam reproduziveis e auditaveis por outras IAs.
3. suite roda de forma estavel no check local.

## Definition of Done
1. baseline de qualidade de scraping por fonte ativo.
2. onboarding de fonte nova passa a exigir fixture+contrato.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - induzir regressao controlada em fixture e confirmar quebra.

## Evidencia esperada
- fixtures por fonte/metodo;
- testes de contrato com thresholds;
- runbook com ritual de recalibracao.

## Riscos
- threshold mal calibrado travar evolucao legitima;
- fixture desatualizada mascarar problema real.

## Blockers possiveis
- falta de amostras estaveis para algumas fontes;
- dependencia acidental de rede em teste de contrato.

## Feedback obrigatorio de retorno
- quais contratos viraram obrigatorios para fonte nova?
- qual threshold inicial foi definido para parse success por fonte?
