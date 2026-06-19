# TASK-AT-147 - Prontidao de producao: Postgres e storage externo

## Metadata
- status: completed-docs
- owner: olympus-orchestrator
- priority: high-when-deploy-decided
- created: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-147-prod-postgres-storage-readiness.md

## Objetivo
Preparar a transicao de SQLite/local storage para infraestrutura de producao com Postgres e storage externo, sem mudar ambiente local de estudo.

## Escopo
1. Revisar Prisma schema contra Postgres.
2. Validar migrations em banco descartavel.
3. Definir provider de storage externo para DANFEs/anexos.
4. Documentar env vars obrigatorias e plano de rollback.
5. Rodar gate de seguranca/deploy antes de exposicao externa.

## Criterios de Aceite
1. Ambiente local continua funcionando com SQLite.
2. Ambiente prod/staging tem instrucoes claras para Postgres/storage.
3. Checklist de rollback e backup fica documentado.

## Resultado
- Criado runbook `docs/operations/production-postgres-storage-readiness.md`.
- O contrato local permanece SQLite + storage local.
- O caminho de producao ficou explicitado com:
  - variaveis obrigatorias;
  - estrategia para Postgres;
  - estrategia para storage externo;
  - gate antes de exposicao externa;
  - rollback de app, schema, storage e integracoes.

## Fora do MVP
- A troca real para Postgres e a implementacao de S3/GCS continuam dependentes da decisao de infraestrutura e devem ser feitas em task propria quando houver alvo de deploy.
