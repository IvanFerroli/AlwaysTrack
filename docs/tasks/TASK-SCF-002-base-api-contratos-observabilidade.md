# TASK-SCF-002 - Base API, contratos e observabilidade

## Metadata
- status: proposed
- owner: scaffolding-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-SCF-002-base-api-contratos-observabilidade.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_orchestrator`
- `olympus_contracts_builder`
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Criar a fundacao de API para que os modulos futuros nao inventem padroes diferentes.

## Inputs
- documento central, secoes 4.2, 12 e 21

## Dependencias
- satisfeitas: `TASK-SCF-001`
- em aberto: n/a

## Alvos explicitos
1. roteamento versionado
2. validacao de payloads
3. formato padrao de erro/resposta
4. logger com request id
5. healthcheck

## Fora de escopo
- CRUD de dominio
- observabilidade paga/externa

## Acceptance Criteria
1. API possui `/health`.
2. Erros sao consistentes e nao vazam stack/secret.
3. Requests possuem correlation/request id nos logs.
4. Existe exemplo de modulo usando rotas, service, repository e schema.

## Validacao
- testes de health/error handler
- `npm run check`

## Riscos
- cada modulo criar seu proprio padrao de controller
