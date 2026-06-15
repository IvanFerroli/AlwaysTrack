# TASK-AT-110 - Seguranca: segredos, envs e deploy de producao

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-110-secrets-env-and-production-deploy-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Garantir que producao nao sobe com segredo fraco, configuracao local, storage inseguro ou deploy frouxo.

## Contexto minimo
O projeto ja possui `scripts/check-env.js`, Dockerfiles e `deploy/docker-compose.example.yml`. O check atual valida algumas variaveis importantes, mas a fase de cyber seguranca precisa tornar isso mais completo.

Segredo aqui significa qualquer valor que, se vazar, permite acesso ou integracao indevida: `SESSION_SECRET`, chaves Google, tokens WhatsApp/Meta, API keys de IA, chave de criptografia de Google OAuth, `DATABASE_URL`, `REDIS_URL`.

## Inputs
- `scripts/check-env.js`
- `services/api/src/config/env.ts`
- `deploy/docker-compose.example.yml`
- `deploy/nginx.conf`
- `Dockerfile.api`
- `Dockerfile.web`
- `.gitignore`
- `docs/operations/*`

## Dependencias
- satisfeitas: env check inicial existe.
- em aberto: decisao de hospedagem real.

## Alvos explicitos
1. Check de producao mais rigido.
2. `.env.production.example` sem segredos reais.
3. Runbook de rotacao de segredos.
4. Regras de arquivo/storage/volume.
5. Configuracao de HTTPS/proxy documentada.

## Explicacao simples
Muitos ataques nao quebram criptografia; eles encontram uma chave esquecida, senha padrao ou app rodando em modo local. Essa task fecha essa porta.

## Fora de escopo
- Provisionar cloud real.
- Migrar para gerenciador de segredos externo.
- Trocar banco.

## Checklist
1. Validar `NODE_ENV=production` no deploy.
2. Bloquear `SESSION_SECRET` fraco ou curto.
3. Exigir HTTPS em `CORS_ORIGIN`, `VITE_API_BASE_URL`, OAuth redirects.
4. Alertar se Google/Meta/IA estiver parcialmente configurado.
5. Garantir `.env*` sensivel no `.gitignore`.
6. Criar `.env.production.example` com comentarios.
7. Documentar rotacao:
   - sessao;
   - Google OAuth;
   - Google service account;
   - IA;
   - Meta/WhatsApp;
   - banco/Redis.
8. Revisar Docker para usuario nao-root se viavel.
9. Documentar backup e permissao de volume local.

## Acceptance Criteria
1. `npm run env:check -- --production` falha com segredo fraco.
2. Exemplo de env nao contem valor real.
3. Deploy example deixa claro o que precisa ser protegido.
4. Runbook explica como trocar segredo se houver suspeita de vazamento.
5. Nenhum segredo novo e commitado.

## Definition of Done
1. Env check reforcado.
2. Documentacao de producao criada/atualizada.
3. Teste ou smoke cobre `check-env`.
4. `.gitignore` revisado.

## Validacao
- comandos/checks: `npm run env:check -- --production`, `npm run repo:hygiene`
- revisao manual: simular env inseguro e confirmar falha.

## Evidencia esperada
- Saida do env check recusando configuracao insegura.
- Runbook em `docs/operations/security-secrets-runbook.md`.

## Riscos
- Check rigido demais pode travar ambiente de demo se nao separar local/producao.
- Rotacao de `SESSION_SECRET` derruba sessoes ativas; documentar.

## Blockers possiveis
- Falta de dominio HTTPS definitivo.

## Retorno esperado
- Lista de variaveis obrigatorias para producao.
- Passo a passo para o usuario configurar com seguranca.
