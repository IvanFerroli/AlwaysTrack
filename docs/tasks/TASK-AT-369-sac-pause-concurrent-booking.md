# TASK-AT-369 - Escolha e reserva concorrente de pausa SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-369-sac-pause-concurrent-booking.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que cada atendente escolha ou cancele seu slot sem overbooking sob concorrencia.

## Contexto minimo
Duas escolhas simultaneas podem enxergar a mesma capacidade. A decisao final precisa ser atomica, idempotente e explicavel.

## Dependencias
- satisfeitas: TASK-AT-368 e TASK-AT-364.
- em aberto: validacao production-like de isolamento depende de Postgres.

## Alvos explicitos
1. APIs de disponibilidade, reservar, cancelar e listar minhas pausas.
2. Transacao/constraint de capacidade e idempotency key.
3. Workspace SAC responsivo de escolha de slot.

## Fora de escopo
- Troca entre atendentes.
- Override de governanca.

## Checklist
1. Revalidar membership, escala, politica e capacidade dentro da transacao.
2. Bloquear duas reservas incompativeis do mesmo atendente.
3. Tratar disputa com `409` e disponibilidade atualizada.
4. Definir janela de cancelamento e preservar evento historico.
5. Exibir slots cheios/indisponiveis sem sugerir acao proibida.

## Acceptance Criteria
1. Requisicoes concorrentes nunca reduzem cobertura abaixo do minimo.
2. Retry da mesma escolha retorna a mesma reserva.
3. SAC nao escolhe para terceiro nem acessa outro tenant.
4. Cancelamento nao apaga a reserva; muda estado e registra ator/motivo aplicavel.

## Validacao
- comandos/checks: teste de concorrencia em Postgres, service/HTTP, teste Web e typecheck.
- revisao manual: dois atendentes disputam a ultima vaga e um recebe conflito acionavel.

## Riscos
- SQLite local mascarar diferencas de lock/isolation de producao.

## Proximo passo provavel
TASK-AT-370

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nao aprovar concorrencia apenas com mock ou SQLite.
