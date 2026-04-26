# TASK-SCR-010 - Ampliar fontes de plataforma com fallback operacional

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-010-ampliar-fontes-plataforma-com-fallback.md

## Modo
- mode: runtime

## Objetivo unico
Aumentar amplitude de coleta em plataformas (LinkedIn, Gupy, Solides, Indeed, Glassdoor e similares) usando estratégia de fallback suportada pelo ambiente sem prometer automação fictícia.

## Contexto minimo
Parte das plataformas está nomeada, mas com bloqueios operacionais no modo feed público automático. Precisamos ampliar cobertura real com caminhos válidos (runner quando possível + acquisition fallback quando bloqueado).

## Inputs
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/acquisition/ats-adapters.ts`
- `services/api/src/features/acquisition/acquisition.service.ts`
- `docs/README.md`

## Dependencias
- satisfeitas: TASK-ACQ-002, TASK-SCR-006, TASK-SCR-009
- em aberto: policy explicita de limites por plataforma (rate/legal)

## Alvos explicitos
1. Definir matriz de suporte por plataforma com `mode: auto | fallback | blocked`.
2. Para `fallback`, padronizar fluxo via acquisition (`url-import`/`browser-capture`) com evidência de origem.
3. Registrar `sourceName` canônico por plataforma em todos os caminhos de ingestão.
4. Atualizar documentação viva com tabela de capacidade real por plataforma.

## Fora de escopo
- autenticação em contas de terceiros;
- bypass de captcha/proteções;
- scraping de áreas privadas.

## Checklist
1. Implementar enum/registro de capacidade por plataforma no runtime.
2. Garantir retorno explícito no report quando plataforma rodar em fallback.
3. Cobrir em teste pelo menos 2 casos `auto` e 2 `fallback`.
4. Atualizar `docs/README.md` com status operacional por plataforma.

## Acceptance Criteria
1. Runner retorna, por plataforma, modo efetivo (`auto|fallback|blocked`).
2. Vagas vindas de fallback ainda entram com `sourceName` correto.
3. Não há claim de scraping automático para plataformas bloqueadas.

## Definition of Done
1. Cobertura de plataformas ampliada com honestidade operacional.
2. Evidência de ingestão para pelo menos 4 plataformas no conjunto total (`auto+fallback`).

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts src/features/acquisition/acquisition.service.test.ts`
- revisao manual:
  - validar payload de rodada com plataformas em modos distintos.

## Evidencia esperada
- patch runtime + testes + doc;
- relatório real mostrando `mode` por plataforma.

## Riscos
- variação frequente de layout das plataformas;
- flutuação de disponibilidade de endpoints públicos.

## Blockers possiveis
- mudanças anti-bot sem feed aberto;
- política interna de compliance para determinadas fontes.

## Feedback obrigatorio de retorno
- quais plataformas ficaram em `auto`, `fallback` e `blocked`?
- qual ganho real de cobertura (quantidade de vagas) após o patch?
