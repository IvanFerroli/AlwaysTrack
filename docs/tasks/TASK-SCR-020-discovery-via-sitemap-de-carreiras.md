# TASK-SCR-020 - Discovery via sitemap de paginas de carreira

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-020-discovery-via-sitemap-de-carreiras.md

## Modo
- mode: runtime

## Objetivo unico
Descobrir URLs candidatas de vagas a partir de sitemaps de dominios aprovados, com gate humano antes de promocao da fonte.

## Contexto minimo
A derivacao de novas fontes ainda e majoritariamente manual. Discovery via sitemap acelera descoberta sem abrir crawler irrestrito.

## Inputs
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/pipeline/pipeline.service.ts`
- `services/api/src/features/pipeline/pipeline.service.test.ts`
- `services/api/src/features/audit/audit.handlers.ts`
- `docs/runbooks/README.md`

## Dependencias
- satisfeitas: TASK-SCR-018
- em aberto: politica de allowlist de dominio para discovery

## Alvos explicitos
1. Criar rotina opcional de discovery por sitemap a partir de seeds aprovadas.
2. Classificar URLs candidatas e salvar sugestoes auditaveis.
3. Exigir aprovacao antes de promover fonte para coleta regular.
4. Limitar discovery por dominio, tempo e volume.

## Fora de escopo
- crawler geral da web;
- promocao automatica sem gate;
- indexacao historica profunda.

## Checklist
1. Definir formato de entrada para seeds de discovery.
2. Implementar parser de sitemap com limites de seguranca.
3. Registrar sugestoes em trilha auditavel.
4. Documentar fluxo de aprovacao e promocao.

## Acceptance Criteria
1. Discovery roda sem impactar ciclo normal de coleta.
2. Sugestoes ficam rastreaveis com origem e racional.
3. Limites operacionais evitam varredura excessiva.

## Definition of Done
1. Discovery por sitemap habilitado de forma controlada.
2. Processo de aprovar novas fontes fica reproduzivel.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/pipeline/pipeline.service.test.ts`
  - `npm run check`
- revisao manual:
  - executar discovery em seeds de teste e validar sugestoes auditaveis.

## Evidencia esperada
- testes de seed+sitemap mock;
- registros de sugestao com status;
- runbook com fluxo operacional do discovery.

## Riscos
- discovery gerar excesso de sugestoes de baixa qualidade;
- custo de rodada subir sem retorno.

## Blockers possiveis
- sitemaps inacessiveis/ilegiveis no ambiente;
- ausencia de criterio claro para aprovacao.

## Feedback obrigatorio de retorno
- qual taxa de sugestoes aprovaveis foi obtida no piloto?
- quais limites por dominio/rodada ficaram no baseline?
