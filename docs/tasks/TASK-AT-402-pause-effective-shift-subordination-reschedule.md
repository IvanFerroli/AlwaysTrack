# TASK-AT-402 - Pausas subordinadas ao turno efetivo

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-402-pause-effective-shift-subordination-reschedule.md

## Modo
- mode: implementation

## Objetivo unico
Fazer reserva, troca, override e remarcacao de Pausa validarem exclusivamente a escala efetiva vigente do atendente.

## Contexto minimo
TASK-AT-367 a TASK-AT-371 usam politica, membership e janelas de turno. Com Escalas, uma Pausa so e elegivel quando cabe integralmente em intervalo efetivo e mantem cobertura.

## Dependencias
- satisfeitas: TASK-AT-369, TASK-AT-370, TASK-AT-371, TASK-AT-395 e TASK-AT-396.
- em aberto: estrategia de transicao para bookings criados antes da escala efetiva.

## Alvos explicitos
1. Validadores/transacoes de SupportPauseBooking e Swap.
2. API de remarcacao explicita ligada ao booking anterior.
3. UI de conflito e escolha de novo slot.

## Fora de escopo
- Mover Pausa automaticamente para o slot mais proximo.
- Cancelar em massa reservas antigas sem revisao.

## Checklist
1. Exigir escala efetiva publicada cobrindo todo o intervalo da Pausa.
2. Revalidar escala e cobertura dentro da mesma transacao da reserva/troca.
3. Detectar Pausa invalidada por excecao/troca/dobra futura.
4. Marcar conflito e exigir `reschedule`, `cancel` ou override autorizado com motivo.
5. Ligar booking anterior/novo e preservar antes/depois, ator e regra.
6. Migrar gradualmente de `shiftWindowsJson` com flag e telemetria.

## Acceptance Criteria
1. Pausa fora do turno efetivo retorna conflito deterministico no backend.
2. Mudanca de escala nunca move ou apaga Pausa silenciosamente.
3. Remarcacao e atomica, idempotente e mantem capacidade minima.
4. Override explica por que turno/cobertura foi violado e aparece no overlap.

## Validacao
- comandos/checks: testes dominio/HTTP/concorrencia/migracao/E2E e Postgres production-like.
- revisao manual: reservar, alterar escala, detectar conflito e remarcar.

## Riscos
- Corrida entre aprovacao de troca de turno e reserva/remarcacao de Pausa.

## Proximo passo provavel
TASK-AT-403

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: lock/revalidacao coordenados entre Escala e Pausa.

