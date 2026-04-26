# TASK-ACQ-001 — Job Acquisition Layer (Wire + UI)

## Metadata
- id: TASK-ACQ-001
- titulo: Conectar a camada de acquisition ao pipeline real (handler, rota, UI)
- modo-de-geracao: continuidade guiada
- capability: job-acquisition
- origem-documental: shared-types (JobAcquisitionInput/Result/Evidence já formalizados), acquisition.service.ts (já existente e não registrado)
- status: completed-with-remarks

## Objetivo único
Registrar o `JobAcquisitionService` já existente no pipeline real da API (handler + rota) e expor a UI de acquisition no Workspace com todos os seis modos: smart-paste, url-import, ats-adapter, browser-capture, email-alert, provider-json.

## Contexto mínimo
O Codex criou `acquisition.service.ts` e os tipos compartilhados de acquisition em uma sessão anterior, mas interrompeu antes de:
1. criar `acquisition.handlers.ts`
2. registrar `POST /v1/jobs/acquire` em `services/api/src/main.ts`
3. criar rota `POST /acquire` em `apps/web/src/main.ts`
4. adicionar seção "Job Acquisition Lab" ao `render-home.ts`

O contrato já está fechado. O serviço já processa todos os métodos. Falta o wiring e a UI.

## Inputs
- `packages/shared-types/src/index.ts` (JobAcquisitionInput, JobAcquisitionResult, JobAcquisitionEvidence) — ✅ existente
- `services/api/src/features/acquisition/acquisition.service.ts` — ✅ existente, não registrado
- `services/api/src/main.ts` — registrador de rotas da API
- `apps/web/src/main.ts` — registrador de rotas do web
- `apps/web/src/features/home/render-home.ts` — renderizador do Workspace

## Dependências satisfeitas
- TASK-CTR-001 (tipos compartilhados) ✅
- TASK-RTM-001 (bootstrap runtime) ✅
- TASK-SCR-001/003 (ingestion service operacional) ✅

## Dependências em aberto
- nenhuma crítica para esta task

## Alvos explícitos

### API
1. `services/api/src/features/acquisition/acquisition.handlers.ts` [NEW]
   - handler `POST /v1/jobs/acquire`
   - lê JSON body como `JobAcquisitionInput`
   - delega a `JobAcquisitionService.acquire()`
   - retorna `ApiResult<JobAcquisitionResult>`

2. `services/api/src/main.ts` [MODIFY]
   - instanciar `JobAcquisitionService(ingestionService)`
   - registrar `router.register("POST", "/v1/jobs/acquire", acquisitionHandlers.acquire)`

### Web
3. `apps/web/src/main.ts` [MODIFY]
   - rota `POST /acquire` lê form body e chama API `POST /v1/jobs/acquire`
   - redireciona para `/workspace?status=success&result=acquired` ou error

4. `apps/web/src/features/ingestion/submit-job.ts` [MODIFY]
   - adicionar `acquireJob(apiBaseUrl, payload: JobAcquisitionInput)` helper

5. `apps/web/src/features/home/render-home.ts` [MODIFY]
   - adicionar seção "Job Acquisition Lab" com tabs/abas para os 6 métodos
   - cada aba tem formulário específico com campos relevantes
   - todos submetem para `POST /acquire`

## Fora de escopo
- Persistência durável (já identificada como próxima task maior)
- Bookmarklet/extensão browser (fase futura)
- Ingestion de email real via SMTP/IMAP (fase futura — o campo de texto é suficiente para MVP)
- Novos ATS adapters específicos (Gupy, Sólides) além do genérico url-import/ats-adapter

## Checklist
- [x] acquisition.handlers.ts criado
- [x] rota API registrada em main.ts
- [x] rota web criada em web/main.ts
- [x] acquireJob helper em submit-job.ts
- [x] seção UI com 6 modos no render-home.ts
- [x] npm run typecheck verde
- [x] npm run lint verde
- [x] smoke coberto por teste oficial de acquisition/ingestion

## Acceptance criteria
- `POST /v1/jobs/acquire` com payload `{method: "smart-paste", rawText: "...", sourceUrl: "https://..."}` retorna `{ok: true, data: {input, ingestion, evidence}}`
- UI mostra 6 abas de acquisition no Workspace, cada uma com formulário funcional
- Os 6 métodos chegam ao mesmo pipeline de ingestão
- typecheck e lint continuam verdes

## Definition of Done
- handler criado e registrado
- UI com todos os métodos visível no /workspace
- typecheck e lint verdes
- smoke local confirmado

## Validação
- `npm run typecheck`
- `npm run lint`
- curl `POST /v1/jobs/acquire` com cada método retorna resultado esperado

## Evidência esperada
- arquivo `acquisition.handlers.ts` no repo
- rota registrada no main.ts da API
- seção "Job Acquisition Lab" visível no /workspace

## Evidência atual
- `npm run check` passou em 2026-04-25 com a suite oficial incluindo `acquisition.service.test.ts`.
- `npm run build` passou em 2026-04-25.
- `npx prisma db push --schema=services/api/prisma/schema.prisma` sincronizou o banco local.

## Risco
- baixo: contrato existente, serviço existente, só wiring e UI

## Blockers possíveis
- nenhum conhecido

## Próximo passo provável
- TASK-ACQ-002: ATS adapters específicos (Gupy, Sólides)
- TASK-PRS-001: persistência local mínima (SQLite/JSON store)
