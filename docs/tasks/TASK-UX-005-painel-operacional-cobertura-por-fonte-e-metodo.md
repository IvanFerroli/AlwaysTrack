# TASK-UX-005 - Painel operacional de cobertura por fonte e metodo

## Metadata
- status: proposed
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-UX-005-painel-operacional-cobertura-por-fonte-e-metodo.md

## Modo
- mode: runtime

## Objetivo unico
Melhorar usabilidade operacional com painel que mostra saude de coleta por fonte/metodo para decisao rapida de ajuste de scraping.

## Contexto minimo
Com diversidade maior de fontes e metodos, operador precisa de leitura direta de onde esta performando e onde degradou sem abrir logs manuais.

## Inputs
- `apps/web/src/features/dashboard/load-dashboard.ts`
- `apps/web/src/features/dashboard/render-dashboard.ts`
- `apps/web/src/core/styles.ts`
- `services/api/src/features/pipeline/pipeline.service.ts`
- `services/api/src/features/scraper/scraper.types.ts`

## Dependencias
- satisfeitas: TASK-SCR-018, TASK-RTM-004, TASK-PRD-008
- em aberto: padrao final de campos de saude exibidos por fonte

## Alvos explicitos
1. Exibir lista por fonte/metodo com status (`ok`, `partial`, `failed`).
2. Mostrar latencia e contadores uteis (`fetched`, `parsed`, `ingested`, `deduplicated`, `errors`).
3. Permitir ordenacao rapida por pior desempenho.
4. Preservar fluxos atuais de ranking/filtro sem regressao.

## Fora de escopo
- redesign completo do dashboard;
- graficos complexos com libs externas;
- analytics historico de longo prazo.

## Checklist
1. Definir view-model minimo para painel operacional.
2. Renderizar estados normal/vazio/falha com clareza.
3. Garantir responsividade em desktop/mobile.
4. Validar que painel nao degrada fluxo principal.

## Acceptance Criteria
1. operador identifica fontes degradadas em poucos segundos.
2. painel usa dados reais de report por fonte/metodo.
3. smoke e checks continuam verdes.

## Definition of Done
1. painel operacional ativo e util para troubleshooting diario.
2. tempo de diagnostico de falha por fonte reduzido.

## Validacao
- comandos/checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run smoke`
- revisao manual:
  - executar pipeline e validar painel em viewport desktop e mobile.

## Evidencia esperada
- tela do painel com dados por fonte/metodo;
- prova de correspondencia entre payload e render;
- smoke sem regressao funcional.

## Riscos
- excesso de informacao gerar ruido visual;
- acoplamento com payload ainda evolutivo.

## Blockers possiveis
- payload atual nao trazer algum campo critico de saude;
- divergencia de nomenclatura entre backend e frontend.

## Feedback obrigatorio de retorno
- o painel de cobertura reduziu tempo de diagnostico em uso real?
- quais campos foram mais uteis para decidir proxima acao operacional?
