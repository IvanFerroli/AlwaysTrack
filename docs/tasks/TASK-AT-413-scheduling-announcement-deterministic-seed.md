# TASK-AT-413 - Seed deterministico de Escalas e Avisos

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-413-scheduling-announcement-deterministic-seed.md

## Modo
- mode: implementation

## Objetivo unico
Estender TASK-AT-387 com massa sintetica idempotente para Escalas, Pausas subordinadas, deep links e Avisos recorrentes.

## Contexto minimo
Um unico turno sem conflito nao exercita excecao, dobra, remarcacao, fallback ou recorrencia 14/29. Seed temporal precisa sobreviver a datas reais sem expirar silenciosamente.

## Dependencias
- satisfeitas: TASK-AT-387 e TASK-AT-399 a TASK-AT-412.
- em aberto: politica de fevereiro e relogio de referencia da demo.

## Alvos explicitos
1. Seed Prisma/reset local idempotente.
2. Fixtures temporais compartilhadas por service/E2E/load.
3. Roteiro de contas/cenarios sinteticos.

## Fora de escopo
- Copiar escala, nomes ou mensagens de producao.
- Marcar seed como evidencia live.

## Checklist
1. Criar duas versoes de regra e turnos-base em dois times.
2. Criar dia normal, folga, ajuste, dobra e slot extra.
3. Criar oferta/troca pendente, aprovada, expirada e concorrente.
4. Criar Pausa valida, invalidada e remarcada com auditoria.
5. Criar notificacao ativa, arquivada/removida e href legado.
6. Criar serie mensal 14/29, ocorrencia futura/publicada/pulada.

## Acceptance Criteria
1. Rodar seed duas vezes produz o mesmo estado logico.
2. Datas derivam de clock/base explicita e cobrem 14/29 sem depender do dia atual.
3. E2E encontra cenarios por chaves estaveis.
4. Massa e sinalizada como local/demo e nao contem PII real.

## Validacao
- comandos/checks: seed/reset repetido, contagens/checksums, E2E focado e `npm run repo:hygiene`.
- revisao manual: walkthrough por role e calendario controlado.

## Riscos
- Seed relativo atravessar mes e alterar a ocorrencia esperada entre etapas.

## Proximo passo provavel
TASK-AT-414

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: clock injetavel e chaves idempotentes.

