# TASK-AT-356 - Gates efetivos de seguranca no runtime de Fluxos

## Metadata
- status: in-progress
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-356-service-flow-runtime-safety-gates.md

## Objetivo unico
Transformar fatos obrigatorios, risco e estado editorial de scripts em restricoes efetivas do executor, especialmente no piloto de Saude.

## Escopo
- Bloquear conclusao quando faltar `requiredFact` declarado no snapshot do no.
- Bloquear `Pular` em etapa obrigatoria ou gate de risco.
- Impedir mutacao de sessao finalizada.
- Nao expor scripts `DRAFT` ou `OBSOLETE` no runner de perfis operacionais.
- Manter visibilidade de rascunhos somente para governanca autorizada.
- Retornar campos faltantes sem registrar seus valores em auditoria.

## Acceptance Criteria
1. `ETAPA-008` nao avanca sem os fatos de saude declarados.
2. Gate financeiro, medico ou de acao humana nao pode ser pulado.
3. SAC nao copia texto editorial ainda nao validado.
4. Gestor continua capaz de revisar rascunhos no contexto de governanca.
5. Testes cobrem autorizacao, falta de fatos e sessao concluida.

## Dependencias
- TASK-AT-350
- TASK-AT-353
