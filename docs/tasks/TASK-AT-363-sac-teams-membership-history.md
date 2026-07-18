# TASK-AT-363 - Times SAC e historico de lotacao

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-363-sac-teams-membership-history.md

## Modo
- mode: implementation

## Objetivo unico
Criar a fundacao tenant-scoped de times SAC e lotacoes historicas usada por pausas, performance e campanhas.

## Contexto minimo
`SalesGroup` e `SellerProfile` representam Vendas e nao podem ser reaproveitados como fonte de verdade SAC. Agregados historicos precisam saber em qual time o atendente estava no periodo medido.

## Dependencias
- satisfeitas: TASK-AT-362.
- em aberto: n/a.

## Alvos explicitos
1. Schema Prisma e migracao aditiva para time e membership SAC.
2. Servico/API administrativa de times e lotacoes.
3. Integracao com Usuarios/Times sem remover referencias legadas.

## Fora de escopo
- Escala detalhada de pausas.
- Migracao automatica de `SalesGroup`.

## Checklist
1. Modelar time, lider, status, timezone e membership com `validFrom`/`validTo`.
2. Impedir lotacoes sobrepostas do mesmo atendente quando a politica exigir time unico.
3. Validar role SAC/SUPERVISOR, organizacao, ativacao e intervalos.
4. Registrar criacao, alteracao e encerramento sem apagar membership.
5. Expor consulta da lotacao vigente e historica por periodo.

## Acceptance Criteria
1. Um tenant nao referencia usuario ou lider de outro tenant.
2. Alterar time hoje nao reatribui metricas ou pausas passadas.
3. Usuario inativo permanece resolvivel no historico, mas nao entra em nova escala.
4. Operacoes repetidas sao idempotentes ou retornam conflito deterministico.

## Validacao
- comandos/checks: testes de service/migracao, `npm run typecheck --workspace @alwaystrack/api` e `git diff --check`.
- revisao manual: criar, mover, encerrar e consultar lotacao em datas distintas.

## Riscos
- Agregados retroativos mudarem ao editar membership atual.

## Proximo passo provavel
TASK-AT-364

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar apenas a fundacao de times e historico.
