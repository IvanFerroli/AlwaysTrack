# EXEC-AT-110 - Seguranca: segredos, envs e deploy de producao

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-110-secrets-env-and-production-deploy-hardening.md

## Entrega
Reforcado o gate local de ambiente de producao e criado runbook operacional de segredos.

## Escopo coberto
1. `scripts/check-env.js` exige `NODE_ENV=production`, banco nao local, `SESSION_SECRET` forte e URLs HTTPS em producao.
2. Validacao condicional para Meta, BullMQ/Redis, Google login, Google OAuth/service account e provider IA.
3. Runbook de rotacao em `docs/operations/security-secrets-runbook.md`.
4. Recomendacao documentada para `.env.production.example`, fora do escopo de escrita deste slice.

## Validacao
- `npm run env:check -- --production` falhou corretamente sem envs locais de producao.
- Exemplo seguro: rode `env:check -- --production` com `NODE_ENV`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN` e `VITE_API_BASE_URL` definidos no shell/secret manager, sem colar valores reais em docs ou logs.
- `npm run repo:hygiene`

## Risco residual
- Sem ambiente alvo real, HTTPS/proxy e volumes persistentes seguem como verificacao manual antes de release.
