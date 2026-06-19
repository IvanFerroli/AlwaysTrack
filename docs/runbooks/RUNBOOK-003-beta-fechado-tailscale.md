# RUNBOOK-003 - Beta Fechado Local via Tailscale

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/runbooks/RUNBOOK-003-beta-fechado-tailscale.md

## Objetivo
Rodar o AlwaysTrack em beta fechado local, com acesso remoto controlado por Tailscale, allowlist nominal por email e segregacao real por role.

## Principios
1. Produto unico, banco unico, build unica.
2. Tailscale controla o acesso de rede.
3. `BETA_ALLOWED_EMAILS` controla quem autentica.
4. Role controla o que o usuario pode fazer.
5. API continua sendo fonte da verdade.

## Variaveis obrigatorias para beta-local
```env
APP_MODE="beta-local"
VITE_APP_MODE="beta-local"
BETA_ALLOWED_EMAILS="admin@alwaysfit.com.br,sac@alwaysfit.com.br,vendedor@alwaysfit.com.br"
GOOGLE_LOGIN_ALLOWED_DOMAINS="alwaysfit.com.br"
```

Se Google Login estiver ativo:

```env
GOOGLE_LOGIN_CLIENT_ID="..."
GOOGLE_LOGIN_CLIENT_SECRET="..."
GOOGLE_LOGIN_REDIRECT_URI="http://SEU_HOST_TAILSCALE:3333/v1/auth/google/callback"
```

O redirect acima precisa existir no Google Cloud Console exatamente como usado.

## Antes de abrir acesso
1. Conferir `git status --short`.
2. Rodar `npm install`.
3. Rodar `npm run setup`.
4. Rodar `APP_MODE=beta-local BETA_ALLOWED_EMAILS=admin@example.com npm run env:check`.
5. Rodar `npm run test --workspace @alwaystrack/api -- auth.service.test.ts access-policy.test.ts search.service.test.ts operations.service.test.ts sales-documents.service.test.ts`.
6. Rodar `npm run typecheck --workspaces --if-present`.
7. Conferir visualmente o banner: "Ambiente Beta Fechado".

## Exposicao via Tailscale
1. Entrar no Tailscale na maquina host.
2. Confirmar o nome/IP Tailscale do host.
3. Liberar acesso somente aos participantes aprovados.
4. Compartilhar URL interna do frontend, normalmente `http://HOST_TAILSCALE:5173`.
5. Nao expor porta publicamente na internet.

## Checklist de login
1. Email fora de `BETA_ALLOWED_EMAILS` nao entra por senha.
2. Email fora de `BETA_ALLOWED_EMAILS` nao entra por Google.
3. Email permitido entra conforme senha/Google.
4. Usuario inativo continua bloqueado.
5. Banner beta aparece para todas as roles.

## Encerramento do beta
1. Remover participantes externos do Tailscale.
2. Remover emails externos de `BETA_ALLOWED_EMAILS`.
3. Exportar ou registrar feedback de homologacao.
4. Guardar prints relevantes da sessao.
5. Se houver dados sensiveis reais, executar rotina de limpeza definida pelo dono do projeto.

## Problemas comuns
- Google retorna erro de redirect: conferir `GOOGLE_LOGIN_REDIRECT_URI` no `.env` e no Google Cloud Console.
- Usuario permitido nao entra: conferir email normalizado em minusculas na allowlist e se o usuario existe/esta ativo no banco.
- SAC ve tela comercial: conferir matriz compartilhada, `navItems` e rotas `/v1/sales/*`.
- Vendedor ve terceiros: conferir `sellerProfile.userId`, escopo de ranking/extratos e busca global.
