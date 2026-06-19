# EXEC-AT-154 - Fase Beta Fechado por Permissoes

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/EXEC-AT-154-closed-beta-permissions.md

## Tasks cobertas
- `TASK-AT-154`: matriz canonica de permissoes do Beta Fechado.
- `TASK-AT-155`: auditoria de rotas e telas contra matriz beta.
- `TASK-AT-156`: backend hardening por role e escopo beta.
- `TASK-AT-157`: testes negativos de permissao do beta.
- `TASK-AT-158`: frontend route guards e navegacao por role beta.
- `TASK-AT-159`: busca global escopada por permissao beta.
- `TASK-AT-160`: ranking e extratos escopados para vendedor beta.
- `TASK-AT-161`: allowlist nominal beta-local por email.
- `TASK-AT-162`: banner visual de homologacao beta-local.
- `TASK-AT-163`: seeds e usuarios controlados do beta.
- `TASK-AT-164`: runbook Beta Fechado via Tailscale.
- `TASK-AT-165`: checklists de homologacao Beta SAC e Beta Vendedor.

## Entregas
1. Matriz compartilhada atualizada em `packages/shared/src/index.ts` e `docs/security/commercial-permission-matrix.md`.
2. SAC sem acesso comercial em API, busca global e navegacao principal.
3. Supervisor sem revisao de notas e sem governanca de campanhas durante o beta.
4. Vendedor preservado em escopo proprio para ranking, extratos, notas e busca.
5. Allowlist `APP_MODE=beta-local` + `BETA_ALLOWED_EMAILS` aplicada a login tradicional e Google Login.
6. Banner `VITE_APP_MODE=beta-local` para homologacao fechada.
7. Central Operacional Hoje ajustada para nao consultar dados comerciais quando SAC acessa.
8. Auditoria de rotas/telas, runbook Tailscale e checklists de homologacao criados.

## Validacao
- `npm run test --workspace @alwaystrack/api -- auth.service.test.ts access-policy.test.ts env.test.ts search.service.test.ts sales-documents.service.test.ts`
- `npm run test --workspace @alwaystrack/api -- operations.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/shared`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `APP_MODE=beta-local BETA_ALLOWED_EMAILS=admin@example.com npm run env:check`

## Riscos residuais
- A decisao sobre esconder leitura de Campanhas para roles comerciais nao gestoras pode ser refinada depois de teste real.
- `VITE_APP_MODE` precisa ser preenchida junto com `APP_MODE` para o banner aparecer no frontend.
- Beta com dados reais ainda depende da disciplina operacional do runbook Tailscale.
