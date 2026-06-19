# EXEC-AT-148 - Integracoes externas com timeout e redaction

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-148-integrations-timeout-redaction-provider-hardening.md
- executed-at: 2026-06-19
- executor: olympus-orchestrator

## Resultado
Criado helper compartilhado para chamadas externas:

- `externalFetch`: aplica `AbortSignal.timeout` por padrao.
- `redactExternalData`: remove campos sensiveis antes de payloads irem para erros/logs.

Aplicacoes nesta fatia:
- Meta WhatsApp provider.
- Google OAuth token exchange.
- Google OAuth revoke.
- Google OAuth refresh.

## Validacao

```bash
npm run typecheck --workspace @alwaystrack/api
npm run test --workspace @alwaystrack/api -- external-http.test.ts provider.test.ts google-oauth.service.test.ts
```

Resultado: OK.

## Risco Residual
Google Sheets/Drive ainda deve migrar para `externalFetch` em task futura dedicada, porque concentra muitas chamadas e tratamento granular de erro.
