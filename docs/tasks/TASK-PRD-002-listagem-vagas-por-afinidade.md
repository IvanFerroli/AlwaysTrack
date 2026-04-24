# TASK-PRD-002 - Listagem de vagas por afinidade na home

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-PRD-002-listagem-vagas-por-afinidade.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- job-matching

## Origem documental
- Pedido explicito do usuario (2026-04-24)
- TASK-SCR-001 concluida (vagas ingeridas disponíveis)
- TASK-PRD-001 concluida (dashboard web operacional)
- Match service existente: POST /v1/match/score

## Objetivo unico
Expor endpoint GET /v1/jobs/ranked que retorna todas as vagas pontuadas e ordenadas
por afinidade com um resume profile, e exibir essa lista ranqueada na home (GET /).

## Contexto minimo
- O MatchService ja sabe calcular score entre uma vaga e um resume profile
- O dashboard ja carrega jobs e resume profiles mas os exibe sem ordem de afinidade
- A home (GET /) usa renderDashboardPage que recebe jobs sem score
- O resume profile a usar para o ranking e o primeiro disponivel no store (ou o mais recente)

## Inputs
- `services/api/src/features/match/match.service.ts` (existente)
- `services/api/src/domain/state/store.ts` (existente)
- `apps/web/src/features/dashboard/load-dashboard.ts` (existente)
- `apps/web/src/features/dashboard/render-dashboard.ts` (existente)
- `packages/shared-types/src/index.ts` (existente)

## Dependencias
- satisfeitas: TASK-SCR-001, TASK-SCR-002, TASK-PRD-001, TASK-CTR-001
- em aberto: n/a

## Alvos explicitos
1. `packages/shared-types/src/index.ts` — adicionar RankedJobPosting (JobPosting + score + matchedSkills)
2. `services/api/src/features/match/match.handlers.ts` — adicionar handler listRanked
3. `services/api/src/features/match/match.service.ts` — adicionar metodo listRanked
4. `services/api/src/main.ts` — registrar GET /v1/jobs/ranked
5. `apps/web/src/features/dashboard/load-dashboard.ts` — adicionar rankedJobs ao DashboardData
6. `apps/web/src/features/dashboard/render-dashboard.ts` — renderizar lista ranqueada com badges de score

## Fora de escopo
- Persistencia de scores em banco
- Filtros avancados (por skill, empresa, localizacao)
- Paginacao
- Score com LLM externo — usar MatchService existente (token overlap)
- Qualquer alteracao em workspace ou ingestion

## Checklist
1. Adicionar RankedJobPosting em shared-types
2. Adicionar listRanked(resumeProfileId?) em MatchService — scores todos os jobs do store
3. Adicionar handler GET /v1/jobs/ranked?resumeProfileId=X em match.handlers
4. Registrar rota em main.ts
5. Atualizar load-dashboard.ts para buscar /v1/jobs/ranked (usando primeiro resume profile disponivel)
6. Atualizar render-dashboard.ts para exibir vagas ranqueadas com score + skills matched
7. npm run check
8. Smoke: GET / mostra vagas ordenadas por score

## Acceptance Criteria
1. GET /v1/jobs/ranked retorna { items: RankedJobPosting[] } ordenado por score DESC
2. A home (GET /) exibe vagas com badge de score de afinidade
3. Vagas com score mais alto aparecem no topo
4. npm run typecheck e lint verdes

## Definition of Done
1. Endpoint ativo e respondendo
2. Dashboard home mostrando ranking visual
3. Quality gates verdes
4. Smoke: abrir http://localhost:3000 e ver vagas ranqueadas

## Validacao
- `npm run check`
- `curl http://localhost:3001/v1/jobs/ranked` — lista com score
- Abrir http://localhost:3000 — ver ranking na home

## Evidencia esperada
- JSON de /v1/jobs/ranked com score por vaga
- Screenshot/descricao da home com vagas ordenadas por afinidade

## Riscos
- Se nao houver resume profile no store, endpoint retorna lista sem score (fallback: score 0)
- Score baseado em token overlap e ruidoso sem SCR-002

## Blockers possiveis
- TASK-SCR-002 nao concluida (scores serao ruidosos mas o endpoint funciona)

## Feedback obrigatorio de retorno
- Confirmar se quer o resume profile selecionavel na home ou sempre o primeiro disponivel
- Confirmar se quer score % ou nivel (alto/medio/baixo) exibido

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: endpoint ativo, home ranqueada, check verde, smoke confirmado
- constraints: usar MatchService existente, sem LLM externo, sem persistencia em banco
