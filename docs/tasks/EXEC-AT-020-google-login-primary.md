# EXEC-AT-020 - Google login primary

## Metadata
- task-id: TASK-AT-014
- execution-id: EXEC-AT-020
- mode: runtime
- execution-mode: direct
- orchestrator: olympus_orchestrator
- specialist: codex
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Auditado o OAuth Google existente de importacao/Sheets em `/v1/integrations/google/*`.
2. Criado fluxo separado de login Google primario em `/v1/auth/google/*`.
3. Implementado OAuth com escopo minimo `openid email profile`, PKCE, state assinado em cookie httpOnly e leitura de perfil via Google userinfo.
4. Associado login apenas por e-mail Google verificado que ja exista como usuario ativo no AlwaysTrack.
5. Atualizada a tela de login para Google como acao principal e email/senha como fallback.
6. Documentadas variaveis `GOOGLE_LOGIN_*` em env/runbooks.

## Artefatos materiais
1. `services/api/src/core/auth/google-login.service.ts`
2. `services/api/src/core/auth/google-login.service.test.ts`
3. `services/api/src/core/auth/auth.service.ts`
4. `services/api/src/core/auth/auth.service.test.ts`
5. `services/api/src/core/auth/auth.handlers.ts`
6. `services/api/src/app.ts`
7. `services/api/src/config/env.ts`
8. `apps/web/src/main.tsx`
9. `apps/web/src/styles.css`
10. `.env.example`
11. `scripts/check-env.js`
12. `docs/runbooks/RUNBOOK-001-ambiente-local.md`
13. `docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md`
14. `docs/tasks/TASK-AT-014-google-login-primary.md`
15. `docs/tasks/EXEC-AT-020-google-login-primary.md`

## Evidências observáveis
1. `npm run test --workspace @alwaystrack/api -- auth.service.test.ts google-login.service.test.ts google-oauth.service.test.ts` - passou; 13 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `npm run typecheck --workspace @alwaystrack/web` - passou.
4. `npm run check` - passou; 153 testes.
5. Login Google fica configuravel por `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET` e `GOOGLE_LOGIN_REDIRECT_URI`.

## Blockers
Nenhum tecnico. Smoke real depende de criar/configurar OAuth Client no Google Cloud.

## Nota para próximo ciclo
Para producao, cadastrar a redirect URI exata no Google Cloud e preencher `GOOGLE_LOGIN_ALLOWED_DOMAINS` se quiser restringir acesso por dominio alem da checagem de usuario ativo existente.
