# EXEC-AT-056 - Google domain restricted login

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-057

## Objetivo
Fechar login Google para uso interno, exigindo dominio corporativo autorizado.

## Entregas
- Callback Google rejeita config vazia e dominios nao autorizados.
- Status/start do Google login so habilitam OAuth quando `GOOGLE_LOGIN_ALLOWED_DOMAINS` existe.
- `env:check` acusa Google OAuth sem dominio permitido.
- Runbooks local/producao documentam as variaveis obrigatorias.

## Validacao
- `npm run test --workspace @alwaystrack/api -- auth.service.test.ts google-login.service.test.ts users.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run env:check`
- Simulacao positiva com `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
- Simulacao negativa sem `GOOGLE_LOGIN_ALLOWED_DOMAINS`.

## Residual
Usuario precisa preencher os valores reais de OAuth e dominio corporativo no ambiente.
