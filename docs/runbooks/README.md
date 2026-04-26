# RUNBOOK Surface

## Objetivo
Padronizar procedimentos operacionais repetiveis com passos verificaveis e evidencia.

## Quando usar
- rotina operacional recorrente;
- validacao de entrega;
- troubleshooting ou resposta a incidente.

## Runbooks ativos relevantes
- `RUNBOOK-001-matching-calibration-baseline.md` - baseline de calibração de matching com dataset curado e thresholds de regressão.

## Convencao minima
- ID: `RUNBOOK-###`
- Arquivo por runbook: `RUNBOOK-###-<slug>.md`
- Base inicial: `docs/runbooks/_template.md`

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Fora de escopo
- spec de arquitetura;
- task manifest;
- texto narrativo sem passos operacionais.

## Navegacao operacional atual
- iniciar em `GET /` para visualizar dashboard, rotas e ranking de vagas.
- usar `GET /workspace` para executar fluxos operacionais: ingest manual, profiles, CV analyzer, approvals, applications, memory e metrics.
- usar `GET /guide` para instrucoes de uso atualizadas.
- usar `GET /health` para verificar web/API.
- no scraper API, `autoDiscard` e opt-in: use `POST /v1/scraper/run?...&autoDiscard=true` quando quiser descarte automático por no-match.

## Validacao local padrao
1. Encerrar processos antigos se necessario: `fuser -k 3000/tcp 3001/tcp 2>/dev/null`.
2. Sincronizar Prisma quando o schema mudar: `npx prisma db push --schema=services/api/prisma/schema.prisma`.
3. Rodar gates: `npm run check`.
4. Rodar smoke web/API automatizado: `npm run smoke`.
5. Subir runtime rapido: `npm run dev`.
6. Ou subir ciclo completo com infraestrutura/Studio: `npm run up`.
7. Abrir `http://localhost:3000/`.
8. Conferir `http://localhost:3001/health` e `http://localhost:3001/v1/metrics`.

## Smoke web/API (`npm run smoke`)
- Objetivo: validar baseline de rotas criticas sem depender de navegacao manual.
- Cobertura minima atual:
  - `GET web /`
  - `GET api /health`
  - `GET web /health`
  - `GET api /v1/jobs/ranked`
  - `POST api /v1/pipeline/run` (payload minimo operacional)
- Comportamento:
  - sobe API/Web em portas isoladas (`3101` e `3100` por padrao);
  - aguarda health dos dois servicos;
  - executa asserts de status + payload minimo;
  - encerra os processos automaticamente ao final.
- Pre-condicoes:
  - `DATABASE_URL` valido;
  - schema Prisma sincronizado para evitar falhas de tabela ausente.
- Troubleshooting rapido:
  - timeout de boot: aumente `SMOKE_START_TIMEOUT_MS` (ex.: `SMOKE_START_TIMEOUT_MS=45000 npm run smoke`);
  - conflito de portas do smoke: ajuste `SMOKE_API_PORT` e `SMOKE_WEB_PORT`;
  - falha de banco: rode `npx prisma db push --schema=services/api/prisma/schema.prisma` e repita.

## Observacoes de runtime
- O estado principal usa Prisma/Postgres via `DATABASE_URL`.
- Contadores criticos de metricas runtime (`ingestionAttempts`, `dedupeHits`, `strategyProposals`) agora sao persistidos no banco e nao reiniciam com a API.
- `npm run dev` usa `src/` via `tsx`.
- `npm run start:*` usa `dist/`; rode `npm run build` antes de usar start.
- Deep Score e CV parsing LLM dependem de `GEMINI_API_KEY` local.
- Servidores fazem bind em `127.0.0.1` por padrao; ajuste `HOST` apenas se quiser expor conscientemente.
- O script `npm run up` nao mata a porta `5432` e nao roda `npm install`; ele assume dependencias ja instaladas e preserva o Postgres local.
- Se `docker` nao estiver instalado, `npm run up` usa o Postgres local configurado em `DATABASE_URL` e deixa o `prisma db push` validar a conexao.
- Para validar apenas setup sem iniciar servidores: `node scripts/start-all.js --setup-only`.
