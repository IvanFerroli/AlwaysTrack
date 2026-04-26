# Repository Audit - 2026-04-25

## Metadata
- status: completed
- owner: codex
- last-updated: 2026-04-25
- source-of-truth: codebase audit + git log + local gates

## Contexto
Auditoria realizada apos varios ciclos conduzidos por agentes diferentes. O objetivo foi normalizar o estado real do repositorio, corrigir quebras de sanidade e alinhar documentacao viva ao que esta implementado.

## Referencia usada
- `git log --oneline -30`
- `apps/web/src/main.ts`
- `services/api/src/main.ts`
- `packages/shared-types/src/index.ts`
- `docs/**`
- gates locais: `npm run typecheck`, `npm run lint`, `npm run test`

## Diagnostico resumido
- O projeto deixou de ser apenas scaffold/documentacao e agora possui alpha local funcional em memoria.
- O codigo implementa ingestao, scraping multi-fonte, profiles, CV analyzer, matching, Deep Score AI, approval gate, applications, memory e metrics.
- A documentacao operacional estava atrasada em relacao ao git log e ao codigo.
- O frontend estava parcialmente quebrado por mistura de estilos antigos, classes Tailwind sem garantia local e markup truncado no Workspace.
- Havia XSS/HTML injection potencial em renderizacoes server-side por interpolacao direta de dados externos.
- O backend tinha typecheck quebrado por payload `unknown` e formatos de scraper desatualizados.
- Match e Strategy calculavam score com regras diferentes.
- `dist/` local estava presente e ignorado, podendo divergir de `src` quando se usa `npm run start:*` sem build.

## Ajustes aplicados
- Corrigidos type guards de update em ingestion e resume profiles.
- Atualizado tipo de formatos do scraper para incluir Himalayas e CryptoJobsList.
- Removido `any` no parser de filtros do match.
- Criado scoring compartilhado em `services/api/src/domain/matching/scoring.ts`.
- Match, ranked jobs e Strategy passaram a usar a mesma regra de score.
- Scoring agora trata skills pontuadas como `node.js`/`next.js` como grupos de tokens equivalentes.
- Keyword do scraper passou a ser injetada com `URLSearchParams` apenas nas fontes com query validada.
- CryptoJobsList saiu do `source=all` ate existir feed/parser operacional confiavel.
- Filtros de ranking passaram a rejeitar `minScore`, `status` e `tags` invalidos com erro 400.
- Fonte de scraper desconhecida ou indisponivel passou a ser erro de entrada, nao erro 500.
- Refeito CSS web como camada local autocontida, sem depender de CDN/Tailwind para renderizar corretamente.
- Refeito Dashboard com rotas reais e sem link GET para endpoints POST.
- Refeito Workspace com formulario de ingest restaurado, profile manager, CV analyzer, approvals, applications, memory e metrics.
- Refeito Guide para refletir o produto atual.
- Adicionados escapes HTML/atributo/JSON para renderizacoes web.
- Reduzido uso de `innerHTML` com dados dinamicos; Deep Score renderiza texto via `textContent`.
- API e Web agora fazem bind em `127.0.0.1` por padrao.
- CORS da API deixou de usar `*` por padrao e passa a usar `WEB_ORIGIN` ou `http://localhost:3000`.
- Validador de ingestao passou a exigir URL `http/https` e limites basicos de tamanho.
- Strategy passou a validar `minimumScore` entre 0 e 100.
- `docs/README.md`, `docs/runbooks/README.md` e `docs/operations/taskyfier-memory.md` foram atualizados.
- Tasks PRD-004..PRD-007 e SCR-005 foram marcadas como `completed-with-remarks` para refletir incorporacao funcional com ressalvas historicas de evidencia.

## Follow-up de estabilizacao Prisma/acquisition
- Servicos de dominio passaram a depender de `StateStore`, nao de `InMemoryStateStore`, permitindo `PrismaStateStore` em runtime real.
- Schema Prisma foi alinhado ao contrato compartilhado para `ApprovalRequest.actionType`, `ApplicationRecord.approvalRequestId`, `ApplicationRecord.evidence` e `MemoryEntry.type`.
- Testes de servico foram atualizados para o contrato assincrono do store.
- Suite oficial da API passou a incluir `acquisition.service.test.ts`.
- Acquisition passou a bloquear IPv6 loopback/private ranges obvios, revalidar redirects manualmente, limitar resposta remota antes de ler todo o corpo e evitar truncamento de JSON antes de parse.
- ATS adapters passaram a validar dominio por host exato/subdominio, evitando match por substring como `gupy.io.attacker.example`.
- `readFormBody` do web recebeu limite de payload.
- `scripts/start-all.js` passou a falhar cedo, nao matar `5432` e nao executar `npm install` implicitamente.
- `.gitignore` passou a ignorar estado local de agentes para evitar vazamento/ruido no repo.

## Gates executados
- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run test`: passou, 18 testes incluindo matching de dotted skills e scraper runner.
- `npm run build`: passou.
- Smoke local: `/`, `/workspace`, `/guide`, `/health` e `/v1/metrics` responderam.
- Smoke de sanidade API: `minScore=abc`, `tags=,`, `source=unknown` e `source=cryptojobslist` retornaram 400 controlado.
- Follow-up Prisma/acquisition: `npm run check` passou com 50 testes.
- Follow-up Prisma/acquisition: `npm run build` passou.
- Follow-up Prisma/acquisition: `npx prisma validate --schema=services/api/prisma/schema.prisma` passou.
- Follow-up Prisma/acquisition: `npx prisma db push --schema=services/api/prisma/schema.prisma` sincronizou o banco local `olympus_climb`.
- Smoke HTTP local em servidores ja ativos: `/`, `/workspace`, `/guide`, `/health`, `/v1/metrics` e `/v1/main-cv/sources` responderam 200.

## Ressalvas documentais
- Alguns execution/verification reports historicos afirmavam aprovacao com base em teste mental ou claims sem output material.
- Esses registros foram preservados como historico, mas a memoria macro agora orienta a tratar validacao atual como dependente de gates locais reais.
- `docs/operations/UX-OVERHAUL-IMPLEMENTATION.md` permanece historico e nao deve ser usado como prova atual sem esta auditoria.

## Riscos remanescentes
- Persistencia principal existe via Prisma/Postgres, mas contadores runtime de metricas ainda reiniciam com a API.
- Deep Score e CV analyzer podem enviar dados a provedor externo quando `GEMINI_API_KEY` esta configurada.
- Nao ha autenticacao/CSRF/token local para rotas mutaveis; mitigado parcialmente por bind local, CORS restrito e uso local consciente.
- Scraper multi-fonte ainda pode crescer memoria local em runs grandes.
- CryptoJobsList requer decisao/task propria para voltar como fonte operacional.
- Ainda falta smoke test automatizado do web server renderizando `/`, `/workspace` e `/guide`.

## Proximo passo recomendado
Automatizar smoke test web/API minimo para proteger `/`, `/workspace`, `/guide`, `/health`, `/v1/metrics` e um fluxo POST controlado antes de expandir mais superficie funcional.
