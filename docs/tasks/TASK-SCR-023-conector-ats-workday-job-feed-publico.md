# TASK-SCR-023 - Conector ATS Workday (job feed publico)

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-023-conector-ats-workday-job-feed-publico.md

## Modo
- mode: runtime

## Objetivo unico
Adicionar cobertura de Workday publico por caminho suportado e seguro, com erros tipados para variacoes de endpoint.

## Contexto minimo
Workday concentra vagas de empresas grandes e costuma ter variabilidade de endpoint. Sem conector dedicado, perdemos volume importante.

## Inputs
- `services/api/src/features/acquisition/ats-adapters.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: cobertura das variacoes mais comuns de host/path Workday

## Alvos explicitos
1. Implementar caminho padrao de coleta Workday publico.
2. Definir fallback seguro para endpoints nao suportados.
3. Expor erro tipado e observavel quando variacao nao for coberta.
4. Cobrir testes para sucesso e falha esperada.

## Fora de escopo
- integracao privada autenticada;
- suporte universal para todos tenants Workday;
- crawler amplo fora do endpoint previsto.

## Checklist
1. Mapear formato minimo da resposta suportada.
2. Implementar parser resiliente para campos chave.
3. Garantir nao regressao de `source=all` em falha parcial.
4. Registrar limites conhecidos da cobertura Workday.

## Acceptance Criteria
1. `source=workday` coleta pelo menos caminho padrao suportado.
2. falhas esperadas retornam erro tipado sem quebrar rodada.
3. testes validam contratos de sucesso e degradacao.

## Definition of Done
1. Conector Workday ativo com cobertura util inicial.
2. Limites e comportamento de fallback documentados.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - rodar `source=workday` em cenario suportado e nao suportado.

## Evidencia esperada
- fixture de payload Workday;
- testes de erro tipado;
- report com contadores por fonte.

## Riscos
- variacao de endpoint reduzir cobertura real;
- custo de manutencao maior por heterogeneidade Workday.

## Blockers possiveis
- falta de endpoints publicos reproduziveis para teste;
- limite de acesso externo no ambiente.

## Feedback obrigatorio de retorno
- qual parcela de endpoints Workday ficou coberta no baseline inicial?
- que tipo de erro foi mais comum nos casos nao suportados?
