# TASK-SCR-001 - Núcleo scraper de vagas: fetch + parse + ingestão

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-SCR-001-nucleo-scraper-vagas.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- job-scraping

## Origem documental
- Pedido explícito do usuário (autorização canônica direta) em 2026-04-24
- Estado operacional: TASK-PRD-001 concluída, runtime local operacional
- Dependência satisfeita: `POST /v1/job-postings/ingest` já existe na API

## Objetivo único
Materializar um módulo scraper executável que faça fetch de vagas a partir de
uma ou mais fontes configuráveis, parse do HTML/JSON retornado e ingestão via
`POST /v1/job-postings/ingest` — sem persistência em banco, sem autenticação
OAuth, sem AI/LLM no scraping.

## Contexto mínimo
- A API já expõe `POST /v1/job-postings/ingest` (services/api/src/features/ingestion)
- O runtime local está operacional (TASK-RTM-001 aprovada)
- O projeto usa TypeScript strict, Node.js nativo (sem frameworks externos além dos já instalados)
- O scraper deve ser um módulo independente, invocável via CLI ou script npm
- Fonte inicial: LinkedIn Jobs public feed OU Greenhouse JSON feed (a escolher — ambos públicos e sem login)
- O scraper NÃO deve depender de browser headless nesta task (sem Playwright/Puppeteer)

## Inputs
- URL alvo de feed público de vagas (configurável via env ou argumento CLI)
- Endpoint da API local: `http://localhost:3001/v1/job-postings/ingest`
- Schema de `JobPosting` em `packages/shared-types/src/index.ts`

## Dependências satisfeitas
- TASK-RTM-001 (runtime local operacional)
- TASK-CTR-001 (contrato `JobPosting` tipado em shared-types)
- TASK-PRD-001 (pipeline de ingestão existente e rota `/v1/job-postings/ingest` ativa)

## Dependências em aberto
- Nenhuma bloqueante

## Alvos explícitos
1. `services/api/src/features/scraper/` — novo módulo (pasta + arquivos)
   - `scraper.types.ts` — tipos internos do scraper
   - `scraper.fetcher.ts` — fetch da fonte remota
   - `scraper.parser.ts` — parse de HTML/JSON para `JobPosting[]`
   - `scraper.runner.ts` — orquestrador: fetch → parse → POST ingest
2. `services/api/src/main.ts` — registrar rota `POST /v1/scraper/run` (trigger manual)
3. `packages/shared-types/src/index.ts` — verificar se `JobPosting` já cobre o contrato; estender se necessário
4. Script npm `"scraper:run"` em `package.json` raiz (opcional, como atalho CLI)

## Fora de escopo
- Browser headless (Playwright, Puppeteer, Selenium)
- Autenticação OAuth / login em portais
- Persistência em banco de dados (SQLite, Postgres)
- Agendamento automático (cron) — apenas trigger manual nesta task
- Scraping de mais de uma fonte simultaneamente — apenas uma fonte configurável
- Tratamento de CAPTCHAs
- Qualquer UI para o scraper

## Checklist de execução
1. Criar `services/api/src/features/scraper/scraper.types.ts`
2. Criar `services/api/src/features/scraper/scraper.fetcher.ts`
3. Criar `services/api/src/features/scraper/scraper.parser.ts`
4. Criar `services/api/src/features/scraper/scraper.runner.ts`
5. Registrar `POST /v1/scraper/run` em `services/api/src/main.ts`
6. Verificar/ajustar `packages/shared-types/src/index.ts` para `JobPosting`
7. Rodar `npm run check` (typecheck + lint) — deve passar verde
8. Smoke test: `POST /v1/scraper/run` → confirmar vagas aparecendo em `GET /v1/job-postings`

## Acceptance Criteria
1. `POST /v1/scraper/run` retorna `{ ok: true, ingested: N }` com N >= 1
2. `GET /v1/job-postings` após o run lista as vagas ingeridas pelo scraper
3. Nenhuma dependência de browser headless no módulo
4. TypeScript strict sem erros
5. Lint verde

## Definition of Done
1. Módulo scraper criado nos alvos explícitos
2. Rota `POST /v1/scraper/run` ativa e respondendo
3. `npm run check` verde
4. Evidência smoke: resposta de `/v1/scraper/run` + `/v1/job-postings` com vagas

## Validação
- `npm run typecheck` → zero erros
- `npm run lint` → zero erros
- `npm run dev` → API sobe na porta 3001
- `curl -X POST http://localhost:3001/v1/scraper/run` → `{ ok: true, ingested: N }`
- `curl http://localhost:3001/v1/job-postings` → lista com vagas do scraper

## Evidência esperada
- Output JSON de `POST /v1/scraper/run`
- Output JSON de `GET /v1/job-postings` com entradas do scraper
- `npm run check` sem erros

## Riscos
- Feed público pode mudar estrutura de HTML/JSON sem aviso
- Rate limiting silencioso em feeds públicos
- `JobPosting` em shared-types pode precisar de campos novos (url, source, scrapedAt)

## Blockers possíveis
- Feed alvo indisponível ou bloqueado por IP no ambiente local
- Shared-types incompatível com campos do scraper → resolver na task sem abrir scope extra

## Próximo passo provável
- TASK-SCR-002: agendamento automático do scraper (cron/interval)
- TASK-SCR-003: múltiplas fontes + deduplicação

## Feedback obrigatório de retorno
- Confirmar qual feed público usar como fonte inicial (Greenhouse, Remotive, Arbeitnow, etc.)
- Confirmar se `JobPosting` em shared-types precisa de campos adicionais (source, scrapedAt, url)
- Confirmar se quer script `scraper:run` no package.json raiz

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: módulo scraper criado, rota ativa, npm run check verde, smoke evidenciado
- constraints: sem browser headless, sem banco, sem autenticação, sem cron nesta task
