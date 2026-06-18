# TASK-AT-114 - Seguranca: integracoes externas, webhooks e IA

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-17
- source-of-truth: docs/tasks/TASK-AT-114-external-integrations-webhooks-and-ai-security.md

## Modo
- mode: audit

## Objetivo unico
Revisar Google, Meta/WhatsApp e provedores de IA para evitar abuso, vazamento de dados e callbacks falsos.

## Contexto minimo
O AlwaysTrack toca integracoes sensiveis:
- Google login;
- Google OAuth/Sheets legado;
- WhatsApp/Meta webhook legado;
- OpenAI/Gemini para extracao de DANFE;
- BullMQ/Redis para jobs.

Cada integracao abre uma fronteira com servico externo. Fronteira externa precisa validar assinatura, escopo, callback, token, erro e logs.

## Inputs
- `services/api/src/core/auth/google-login.service.ts`
- `services/api/src/core/integrations/google/*`
- `services/api/src/core/notifications/notifications.handlers.ts`
- `services/api/src/core/notifications/provider.ts`
- `services/api/src/core/document-ai/provider.ts`
- `services/api/src/core/jobs/*`
- `services/api/src/config/env.ts`

## Dependencias
- satisfeitas: Google login com dominio permitido ja existe.
- em aberto: `TASK-AT-110` para segredos/envs.

## Alvos explicitos
1. Revisao de OAuth state/PKCE/callback.
2. Revisao de verificacao de webhook Meta.
3. Revisao de escopos Google.
4. Politica de dados enviados para IA.
5. Protecao de logs contra tokens e dados sensiveis.
6. Timeouts e tratamento de erro em chamadas externas.

## Explicacao simples
Sempre que o sistema fala com outro servico, existem duas perguntas: "tenho certeza que a mensagem veio dele?" e "tenho certeza que estou mandando so o necessario para ele?"

## Fora de escopo
- Remover integracoes.
- Criar proxy corporativo.
- Treinar modelo proprio.

## Checklist
1. Confirmar que Google login usa PKCE/state e escopo minimo.
2. Confirmar que callback nao aceita redirect/origin arbitrario.
3. Revisar criptografia/armazenamento de tokens Google.
4. Confirmar verificacao de assinatura Meta no webhook.
5. Garantir que IA recebe somente conteudo necessario da DANFE.
6. Garantir timeout/retry/backoff seguro em IA.
7. Garantir que erro externo nao vaza chave ou payload sensivel.
8. Documentar decisao sobre dados comerciais enviados a IA.

## Acceptance Criteria
1. Webhook falso nao e aceito.
2. OAuth callback invalido nao cria sessao/conexao.
3. Chaves/tokens nao aparecem em logs.
4. IA tem timeout e erro controlado.
5. Documento explica quais dados podem sair do ambiente interno.

## Definition of Done
1. Relatorio de revisao criado.
2. Testes adicionados para webhook/callback quando faltarem.
3. Tasks corretivas criadas se houver gap grande.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- google`, `npm run test --workspace @alwaystrack/api -- notifications`, `npm run test --workspace @alwaystrack/api -- document-ai`
- revisao manual: conferir envs e escopos configurados.

## Evidencia esperada
- Relatorio de integracoes e riscos.
- Teste de callback/webhook invalido.

## Riscos
- Escopo Google/Meta legado ainda existir mesmo fora do produto comercial.
- Provedor de IA receber mais dados que o necessario.

## Blockers possiveis
- Falta de credenciais reais para smoke externo.

## Retorno esperado
- Lista de integracoes aprovadas para producao.
- Lista de integracoes que devem ficar desligadas.

## Resultado de execucao
- execution: docs/tasks/EXEC-AT-114-external-integrations-webhooks-and-ai-security.md
- review: docs/security/external-integrations-security-review.md
- status: completed em 2026-06-17
- validacao:
  - `npm run test --workspace @alwaystrack/api -- google`
  - `npm run test --workspace @alwaystrack/api -- notifications`
  - `npm run test --workspace @alwaystrack/api -- document-ai`
