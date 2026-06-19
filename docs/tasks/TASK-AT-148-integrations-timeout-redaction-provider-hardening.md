# TASK-AT-148 - Integracoes externas: timeout, redaction e providers reais

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-148-integrations-timeout-redaction-provider-hardening.md

## Objetivo
Padronizar resiliencia e seguranca em chamadas externas, principalmente Google Sheets/Drive, IA e futuro provider real Meta/WhatsApp.

## Plano
1. Criar helper de fetch/HTTP externo com timeout padrao.
2. Garantir redaction de tokens, secrets e payload sensivel em logs.
3. Padronizar erros operacionais exibidos ao usuario.
4. Documentar mocks/smokes para cada provider.
5. Implementar provider Meta real apenas quando credenciais e escopo estiverem definidos.

## Criterios de Aceite
1. Nenhuma chamada externa relevante fica sem timeout.
2. Logs nao imprimem tokens ou dados sensiveis.
3. Falhas externas geram erro acionavel, nao silencio.

## Resultado
Executada em 2026-06-19 como MVP de hardening:
- helper `externalFetch` centraliza timeout para chamadas externas;
- helper `redactExternalData` remove tokens/secrets/autorizacoes de payloads aninhados antes de expor erro;
- Meta WhatsApp usa timeout e redaction no erro do provider;
- Google OAuth callback, revoke e refresh usam timeout;
- testes cobrem timeout/redaction e os providers afetados.

## Fora do MVP
Google Sheets/Drive ainda tem varias chamadas diretas no helper de importacao. A recomendacao e migrar essa classe em fatia separada para evitar regressao larga, porque ali existem criacao, permissao, metadata, batchUpdate e tratamento fino de erro Google.
