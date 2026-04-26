# DOCS - OLYMPUS CLIMB

## Fonte viva
- `docs/` e a fonte viva e canonica de documentacao operacional e de engenharia.
- `doc/` permanece como arquivo historico (PDFs legados e CVs locais).

## Decisao operacional de superficie ADR
- ADRs devem ser registradas em `docs/adr/`.
- `docs/decisions/` nao e superficie ativa neste ciclo.
- Nao criar `docs/decisions/` sem revisao canonica formal.

## Mapa minimo de superficies
- `docs/adr/`: registros de decisao arquitetural (ADRs).
- `docs/specs/`: especificacoes executaveis por capacidade/eixo.
- `docs/tasks/`: manifests de task executavel e evidencias historicas.
- `docs/runbooks/`: procedimentos operacionais de rotina, validacao e incidente.
- `docs/operations/`: estado vivo dos kits, memoria operacional e auditorias.

## Estado implementado atual
- O projeto possui um alpha local funcional com API persistida via Prisma/Postgres.
- O runtime web/API roda pela raiz com `npm run dev` quando o Postgres e o schema Prisma ja estao prontos.
- Para subir infraestrutura, sincronizar schema e abrir Web/Prisma Studio, usar `npm run up`.
- A validacao de sanidade usa `npm run check`.
- O baseline de smoke web/API automatizado roda com `npm run smoke`.
- Vagas, resume profiles, approvals, applications, audit logs e memoria runtime sao persistidos no banco configurado em `DATABASE_URL`.
- Metricas de processo como tentativas/dedupe/propostas ainda possuem contadores runtime em memoria e zeram ao reiniciar a API.

## Mapa de rotas web
- `GET /`: dashboard, indice central de rotas e vagas ranqueadas.
- `GET /workspace`: superficie operacional para ingest manual, resume profiles, CV analyzer, approvals, applications, memory e metrics.
- `GET /guide`: guia vivo de uso do alpha local.
- `GET /health`: health JSON do web com status da API.
- `POST /ingest`: cria vaga manual e dispara score/strategy.
- `POST /resume-profiles`: cria resume profile manual.
- `POST /main-cv/analyze`: cria resume profile a partir de arquivo `.txt` em `doc/`.
- `POST /acquire`: acquisition multimodal de vaga via form do Workspace.
- `POST /approve`: aprova approval request.
- `POST /reject`: rejeita approval request.
- `POST /applications/status`: atualiza application para `interview` ou `rejected`.

## Mapa de rotas API
- `GET /health`: health da API.
- `GET /ping`: ping simples.
- `GET /v1/job-postings`: lista vagas ingeridas.
- `POST /v1/job-postings/ingest`: ingere vaga via JSON.
- `POST /v1/jobs/update`: atualiza status/tags de vaga.
- `GET /v1/jobs/ranked`: lista vagas ranqueadas com filtros.
- `GET /v1/resume-profiles`: lista profiles.
- `POST /v1/resume-profiles`: cria profile.
- `POST /v1/resume-profiles/update`: atualiza profile.
- `GET /v1/resume-profiles/get`: busca profile por `id`.
- `GET /v1/main-cv/sources`: lista arquivos `.txt` em `doc/`.
- `POST /v1/main-cv/analyze`: analisa CV e cria profile.
- `POST /v1/scraper/run`: roda scraper com `source` e `keyword` opcionais.
  - Matriz operacional de fontes:
    - `auto`: Remotive, Arbeitnow, RemoteOK, Jobicy, Himalayas, LinkedIn, Gupy, CryptoJobsList (RSS)
    - `fallback`: Solides, Indeed, Glassdoor (via acquisition `url-import`)
    - `blocked`: nenhuma fonte ativa no baseline atual
- `POST /v1/pipeline/run`: executa ciclo unificado (`scrape/acquire -> rank -> shortlist`) com tolerancia a falha parcial e evidencias em `agent-runs`, `decision-logs` e `skill-executions`.
  - Guardrails de rodada aceitos no payload: `maxLlmJobs`, `maxDurationMs`, `maxSources`, `maxEstimatedCostUsd`.
  - Retorno inclui consumo e cortes aplicados em `llm` e `budget.cutsApplied`.
- `POST /v1/match/score`: score local por skills encontradas, aliases tecnicos e boosts quando skills/headline aparecem no titulo.
- `POST /v1/jobs/acquire`: acquisition multimodal com smart-paste, url-import, ats-adapter, browser-capture, email-alert e provider-json.
- `POST /v1/match/deep-score`: score LLM com Gemini quando `GEMINI_API_KEY` existe.
- `POST /v1/strategy/propose`: propoe candidatura com gate humano.
- `GET /v1/approval-queue`: lista approvals pendentes.
- `POST /v1/approval-queue/approve`: aprova request.
- `POST /v1/approval-queue/reject`: rejeita request.
- `GET /v1/applications`: lista applications.
- `POST /v1/applications/update-status`: atualiza status de application.
- `GET /v1/memory-entries`: lista memoria runtime.
- `GET /v1/metrics`: snapshot de metricas.
- `GET /v1/agent-runs`: lista runs internos.
- `GET /v1/decision-logs`: lista decisoes.
- `GET /v1/skill-executions`: lista execucoes/evidencias.

## Capacidades implementadas
- Ingestao manual de vagas com dedupe e auditoria.
- Acquisition multimodal de vagas via paste, URL, adapters ATS, browser capture, email alert e provider JSON.
- ATS adapters especificos para Gupy, Solides, LinkedIn, Indeed, Glassdoor, Infojobs, Catho e Trabalha Brasil, com matching de host por dominio exato/subdominio.
- Scraper multi-fonte com tolerancia parcial por fonte, matriz operacional (`auto|fallback|blocked`) e keyword apenas em fontes com query validada.
- Platform scraper para LinkedIn public guest search, Gupy public portal e CryptoJobsList RSS em `auto`, com plataformas sem feed estavel tratadas em `fallback` sem claim de automacao ficticia.
- Pipeline unificado para rodada de coleta e triagem com shortlist explicada via endpoint unico (`/v1/pipeline/run`).
- Pipeline unificado possui guardrails de budget/duração/volume para operar com custo e latência previsíveis.
- Keyword do scraper tambem aplica pos-filtro local antes de persistir; termos de senioridade como `junior` precisam aparecer no titulo.
- Strip HTML em descricoes de feeds.
- Ranking por afinidade local com filtros multi-select derivados das vagas carregadas: tags/skills, local, fonte, status e score minimo.
- Afinidade local usa tokens normalizados da vaga, aliases tecnicos (`node`/`node.js`, `react`/`react.js`, etc.) e boosts controlados por titulo.
- Tags e status manuais por vaga.
- Resume profiles manuais e editaveis.
- CV analyzer baseado em arquivos `.txt` de `doc/`.
- Deep Score com Gemini quando habilitado por chave local.
- Strategy proposal com approval queue.
- Approval/rejection e application status tracking.
- Memory entries, decision logs, skill executions e metrics.

## Convencoes minimas
- IDs:
  - ADR: `ADR-###`
  - SPEC: `SPEC-###`
  - TASK: `TASK-<TRACK>-###` (ex.: `TASK-PRD-005`, `TASK-SCR-001`, `TASK-QLT-001`)
  - RUNBOOK: `RUNBOOK-###`
- Campos de governanca obrigatorios em todo artefato:
  - `status`
  - `owner`
  - `last-updated`
  - `source-of-truth` para novos artefatos canonicos ou quando o artefato declarar decisao operacional

## Regra de escopo
- `docs/` organiza formalizacao viva e evidencias.
- Produto deve continuar capability-driven, spec-driven e orientado por gates.
- Claims historicos sem evidencia de comando devem ser tratados como historicos, nao como validacao atual.
- Ultimo ciclo consolidado: `TASK-SCR-011` (reativacao de CryptoJobsList via RSS parser dedicado) com detalhes em `docs/tasks/`.
