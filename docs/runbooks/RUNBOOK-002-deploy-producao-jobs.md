# RUNBOOK-002 - Deploy producao e jobs

## Metadata
- status: active
- owner: ops-builder
- last-updated: 2026-05-29
- source-of-truth: docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md

## Objetivo
Publicar web, API, banco/storage persistentes, webhook Meta e job de notificacoes com custo baixo.

## Pre-condicoes
- Host ou provider com Docker/Compose.
- Dominio/HTTPS apontando para web e API.
- Secrets definidos fora do repositorio em `.env.production` ou painel do provider.
- Em modo producao, `CORS_ORIGIN` e `VITE_API_BASE_URL` devem ser URLs publicas; `localhost` e loopback sao rejeitados por `env:check`.

## Envs principais
- API: `APP_NAME`, `DATABASE_URL`, `SESSION_SECRET`, `SESSION_COOKIE_NAME`, `API_PORT`, `CORS_ORIGIN`, `STORAGE_PROVIDER`, `STORAGE_LOCAL_DIR`, `DOCUMENT_MAX_BYTES`. `SESSION_SECRET` deve ter pelo menos 32 caracteres.
- Web: `VITE_API_BASE_URL` apontando para a URL publica da API; `VITE_APP_NAME` alinhado ao `APP_NAME` usado pela API.
- Meta: `NOTIFICATION_PROVIDER=meta`, `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`.
- Job: `NOTIFICATION_JOB_LIMIT`.

## Decisao de persistencia
O template ainda usa Prisma com SQLite por padrao. Em producao, ha duas rotas aceitas ate nova decisao arquitetural:
- manter `DATABASE_URL=file:./dev.db` com volume persistente e backup operacional;
- migrar para outro banco somente com alteracao explicita de schema, migracoes e runbook.

`STORAGE_PROVIDER=local` tambem exige volume persistente e rotina de backup. Storage externo ainda nao e contrato implementado.

## Deploy com Docker Compose
1. Copiar `.env.example` para `.env.production` no host e preencher secrets reais.
2. Rodar `npm run env:check -- --production` com as envs carregadas.
3. Buildar e subir: `docker compose --env-file .env.production -f deploy/docker-compose.example.yml up -d --build api web`.
4. Aplicar schema/seed inicial se necessario: `docker compose --env-file .env.production -f deploy/docker-compose.example.yml exec api npm run setup`.
5. Configurar cron do host com `deploy/cron.example`.

## Webhook Meta
1. URL publica: `https://<api-host>/v1/webhooks/meta-whatsapp`.
2. Verify token: mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`.
3. Assinatura: manter `META_APP_SECRET` configurado para validar `x-hub-signature-256`.
4. Smoke de verificacao:
   `curl "https://<api-host>/v1/webhooks/meta-whatsapp?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=ok"`

## Jobs
- O comando previsivel é `npm run job:notifications --workspace @alwaystrack/api`.
- Em Compose: `docker compose --env-file .env.production -f deploy/docker-compose.example.yml --profile jobs run --rm notification-job`.
- Frequencia recomendada inicial: a cada 10 minutos.

## Validacao
- `curl https://<api-host>/health`
- Login no web usando admin real.
- `docker compose --env-file .env.production -f deploy/docker-compose.example.yml logs api --tail=100`
- Executar job manual e verificar JSON com `scanned`, `skipped` e `processed`.

## Rollback/contingencia
1. Voltar imagem anterior do provider ou `docker compose --env-file .env.production -f deploy/docker-compose.example.yml down && docker compose --env-file .env.production -f deploy/docker-compose.example.yml up -d` com tag anterior.
2. Desabilitar cron se houver envio indevido.
3. Trocar `NOTIFICATION_PROVIDER=fake` para pausar envio real mantendo scanner seguro.
