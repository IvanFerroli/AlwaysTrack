# TASK-AT-148 - Integracoes externas: timeout, redaction e providers reais

## Metadata
- status: proposed
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
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

