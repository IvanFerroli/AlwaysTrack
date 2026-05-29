# EXEC-TMP-006 - Execution Report

## Metadata
- task-id: ROADMAP item 5 (parametrizar marca, seed, tenant publico e templates)
- execution-id: EXEC-TMP-006
- mode: runtime + documental
- execution-mode: execution artifact mode
- orchestrator: olympus_orchestrator
- specialist: runtime-ops
- status: executado
- date: 2026-05-29

## Sequencia operacional aplicada
1. Revisado o diff deixado pela execucao interrompida: `SESSION_COOKIE_NAME` existia em `loadEnv`, mas ainda nao era usado pelo runtime de auth.
2. Conectado o nome parametrizado do cookie nos fluxos de login, logout e `requireAuth`.
3. Ajustados fixtures de testes que constroem `ApiEnv` manualmente.
4. Documentado `SESSION_COOKIE_NAME` em `.env.example`, `scripts/check-env.js` e runbooks.
5. Atualizado ROADMAP e orchestrator-state.

## Artefatos materiais
1. `services/api/src/config/env.ts` - contrato `sessionCookieName`.
2. `services/api/src/core/auth/session.ts` - helper `getSessionCookieName`.
3. `services/api/src/core/auth/auth.handlers.ts` - login/logout usam o cookie configurado.
4. `services/api/src/core/auth/auth.middleware.ts` - leitura de sessao usa o cookie configurado.
5. `.env.example`, `scripts/check-env.js`, runbooks - env exposta no contrato operacional.

## Evidencias observaveis
- `npm run typecheck --workspace @alwaystrack/api` passou.
- `npm run test --workspace @alwaystrack/api` passou: 22 arquivos, 115 testes.
- `npm run check` passou: lint, typecheck dos workspaces e 115 testes.

## Estado da parametrizacao apos este ciclo
| Item | Estado |
| --- | --- |
| Seed demo | Parametrizado via env vars existentes |
| FAQ publica org default | Sem fallback para demo-org desde EXEC-TMP-004 |
| Cookie de sessao | Parametrizado via `SESSION_COOKIE_NAME` |
| APP_NAME / manifest por env | Pendente de task propria |

## Blockers
Nenhum blocker tecnico para o cookie de sessao. `APP_NAME` por env segue fora deste patch para manter o escopo pequeno e evitar misturar contrato de build web com auth runtime.
