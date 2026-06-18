# EXEC-AT-114 - External integrations, webhooks and AI security

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-114-external-integrations-webhooks-and-ai-security.md
- execution-id: EXEC-AT-114

## Roteamento Olympus
- routable: yes
- execution_mode: audit
- specialist: security/runtime-quality hybrid
- artifact_mode: execution artifact mode

## Pacote de execucao
handoff_to: security reviewer

execution_mode: audit with focused boundary tests

scope_guardrails:
- Editar apenas review/report/task e testes/codigo focados nas fronteiras permitidas.
- Nao editar `docs/tasks/ROADMAP.md`.
- Nao ligar integracoes reais nem executar smoke externo com credenciais.
- Nao fazer refactor amplo.

expected_artifacts:
- Relatorio em `docs/security/external-integrations-security-review.md`.
- Evidencia de teste para callback OAuth invalido e webhook falso.
- Politica documentada para dados enviados a IA e redacao de tokens/logs.
- Lista de toggles aprovados para producao vs devem ficar off.

## Escopo coberto
1. Google login: state assinado, PKCE S256, scopes minimos, callback com redirect fixo e dominio permitido.
2. Google OAuth/Sheets legado: state persistido/hash, PKCE, refresh token criptografado, scopes e callback invalido.
3. Meta WhatsApp/webhook: provider fake default, challenge token, HMAC `x-hub-signature-256` e raw body.
4. AI providers: dados enviados a OpenAI/Gemini, resposta estruturada, auditoria sem bytes e timeout de 30s.
5. BullMQ/Redis: toggle inline/bullmq, Redis URL/TLS, dedupe, retry/backoff e risco de payload.
6. Toggles: habilitar Google login em producao controlada; manter Sheets legado, Meta, AI real e BullMQ off salvo decisao explicita.

## Alteracoes materiais
- Criado `docs/security/external-integrations-security-review.md`.
- Adicionado teste de callback Google OAuth invalido antes de token exchange.
- Adicionado teste de webhook Meta com assinatura invalida antes de lookup/log.
- Adicionado timeout signal de 30 segundos nas chamadas OpenAI/Gemini.
- Adicionado teste garantindo timeout signal em OpenAI/Gemini.
- Atualizado status da task para completed.

## Validacao executada
- `npm run test --workspace @alwaystrack/api -- google`
- `npm run test --workspace @alwaystrack/api -- notifications`
- `npm run test --workspace @alwaystrack/api -- document-ai`

## Evidencia material
- Google: 14 testes passaram no alvo `google`, incluindo o novo callback invalido.
- Notifications: 21 testes passaram no alvo `notifications`, incluindo o novo webhook falso.
- Document AI: 4 testes passaram no alvo `document-ai`, incluindo timeout signal para OpenAI/Gemini.

## Riscos residuais
- Smoke externo nao executado por falta de credenciais reais.
- Meta deve continuar off se `META_APP_SECRET` nao estiver configurado; evento POST sem secret nao tem HMAC obrigatorio.
- Google Sheets/Drive e Meta provider ainda nao receberam timeout padronizado neste slice.
- Escopo Google `spreadsheets` e amplo para legado e deve ser reavaliado se a integracao permanecer.
- Gemini usa API key na query string; evitar qualquer log de URL completa.

## Verification package para Task Verifier
Arquivos principais:
- `docs/security/external-integrations-security-review.md`
- `docs/tasks/TASK-AT-114-external-integrations-webhooks-and-ai-security.md`
- `services/api/src/core/integrations/google/google-oauth.service.test.ts`
- `services/api/src/core/notifications/notifications.service.test.ts`
- `services/api/src/core/document-ai/provider.ts`
- `services/api/src/core/document-ai/provider.test.ts`

Checks sugeridos:
- Confirmar que o review cobre Google login/OAuth, Sheets, Meta webhook, AI providers e BullMQ/Redis.
- Confirmar que toggles prod/off estao explicitos.
- Confirmar que os tres comandos de teste passaram.
- Confirmar que a task nao editou `docs/tasks/ROADMAP.md`.

## Retorno ao Taskyfier
- Marcar TASK-AT-114 como concluida.
- Considerar follow-up pequeno para timeouts/redacao em Google Sheets/Drive e Meta provider.
- Considerar guard de producao para impedir `NOTIFICATION_PROVIDER=meta` sem `META_APP_SECRET`, alinhado a TASK-AT-110.
