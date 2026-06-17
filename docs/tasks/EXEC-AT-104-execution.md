# EXEC-AT-104 - Auth session and login hardening

## Escopo
- Implementado somente TASK-AT-104.
- Mudancas focadas em `services/api/src/core/auth/*`, `services/api/src/core/users/users.service.ts`, testes de auth/users, schema Prisma e migration.

## Politica final
- Sessao assinada expira no servidor por `issuedAt`.
- Duracao padrao: 8 horas.
- Configuracao: `SESSION_MAX_AGE_SECONDS`.
- Limite maximo: 12 horas, mesmo se env configurar valor maior.
- Reset administrativo de senha atualiza `passwordChangedAt` e invalida tokens emitidos antes do reset.
- Senhas de criacao/reset precisam ter 12+ caracteres, 3 classes de caracteres, nao podem ser obvias e nao podem conter email/local-part relevante.

## Evidencias esperadas
- Teste de token expirado em `auth/session.test.ts`.
- Teste de invalidacao por `passwordChangedAt` em `auth/auth.middleware.test.ts`.
- Testes de senha fraca em `auth/password.test.ts` e `users.service.test.ts`.
- Testes de auditoria de falha em `auth/auth.service.test.ts`.

## Validacao
- OK: `npm run test --workspace @alwaystrack/api -- auth users.service.test.ts` (43 testes).
- OK: `npx prisma generate --schema services/api/prisma/schema.prisma`.
- Parcial: `npm run typecheck --workspace @alwaystrack/api` ainda falha por fixtures `ApiEnv` fora do escopo de TASK-AT-104 que nao incluem campos obrigatorios de rate limit/CORS.

## Riscos de regressao
- Usuarios com tokens emitidos antes da migration podem precisar logar novamente, pois `passwordChangedAt` recebe o timestamp de aplicacao da migration.
- Seeds ou rotinas que ainda usam senha fraca precisam adotar senha compatível com a nova politica.
