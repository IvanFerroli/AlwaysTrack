# TASK-RTM-004 - Persistir metricas de runtime e dedupe historico

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-RTM-004-metricas-runtime-persistidas.md

## Modo
- mode: runtime

## Objetivo unico
Eliminar dependencia de contadores apenas em memoria para metricas-chave (`ingestionAttempts`, `dedupeHits`, `strategyProposals`) com persistencia historica confiavel.

## Contexto minimo
A memoria operacional registra que alguns contadores de processo ainda zeram em restart. Isso reduz qualidade de observabilidade e dificulta calibracao.

## Inputs
- `services/api/src/domain/state/store.ts`
- `services/api/src/domain/state/prisma-store.ts`
- `services/api/src/features/observability/*`
- `prisma/schema.prisma`
- `services/api/src/features/ingestion/ingestion.service.ts`
- `services/api/src/features/strategy/strategy.service.ts`

## Dependencias
- satisfeitas: TASK-RTM-001, TASK-SCR-009
- em aberto: decisao entre persistir agregado ou recalcular por eventos

## Alvos explicitos
1. Definir modelo de persistencia para metricas runtime (tabela agregada ou event-sourcing leve).
2. Atualizar `snapshotMetrics` para leitura consistente mesmo apos restart.
3. Garantir compatibilidade backward com payload atual de `/v1/metrics`.
4. Cobrir migracao e testes de regressao de metricas.

## Fora de escopo
- dashboard analitico avancado;
- BI externo;
- historico granular de alta cardinalidade sem necessidade imediata.

## Checklist
1. Criar migracao Prisma para suporte de metricas persistidas.
2. Atualizar StateStore/PrismaStore para leitura e escrita persistente.
3. Ajustar testes de observabilidade para validar continuidade apos novo store.
4. Documentar trade-offs da abordagem escolhida.

## Acceptance Criteria
1. Reinicio da API nao zera mais metricas principais.
2. `GET /v1/metrics` retorna valores coerentes com historico recente.
3. Testes cobrindo persistencia passam de forma deterministica.

## Definition of Done
1. Metricas criticas deixam de depender de memoria volátil.
2. Runbook/documentacao refletem novo comportamento.

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run test --workspace @olympus/api -- src/features/observability/observability.service.test.ts`
- revisao manual:
  - executar ingest/strategy, reiniciar API, confirmar continuidade dos contadores.

## Evidencia esperada
- migracao Prisma aplicada;
- payload `/v1/metrics` consistente pre e pos restart;
- testes de observabilidade atualizados.

## Riscos
- migracao mal desenhada causar lock ou custo de query alto;
- dupla contagem em cenarios de retry.

## Blockers possiveis
- falta de ambiente com banco para validar restart real;
- ambiguidade de regra para retropreenchimento historico.

## Feedback obrigatorio de retorno
- qual modelo foi adotado (agregado ou eventos) e por que?
- houve impacto de performance no endpoint `/v1/metrics`?
