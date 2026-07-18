# TASK-AT-400 - Ofertas, trocas e aprovacoes de turno SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-400-sac-shift-offers-swaps-approvals.md

## Modo
- mode: implementation

## Objetivo unico
Implementar oferta aberta, troca direta, aceite, aprovacao, recusa, expiracao e cancelamento de turnos efetivos.

## Contexto minimo
Troca de Pausa da TASK-AT-370 nao troca jornada. Escalas exigem workflow proprio, elegibilidade por regra e revalidacao de descanso/cobertura antes do commit.

## Dependencias
- satisfeitas: TASK-AT-392, TASK-AT-395, TASK-AT-396 e TASK-AT-397.
- em aberto: quando aceite bilateral dispensa aprovacao gerencial.

## Alvos explicitos
1. Schema/migracao e state machine de oferta/troca/aprovacao.
2. APIs inbox/outbox, aceitar, decidir, cancelar e expirar.
3. UI pessoal/gerencial e notificacoes tipadas deduplicadas.

## Fora de escopo
- Marketplace entre organizacoes.
- Alteracao de folha ou pagamento.

## Checklist
1. Suportar oferta aberta elegivel e troca direcionada entre dois dias/intervalos.
2. Congelar referencias dos snapshots envolvidos e versao da regra.
3. Revalidar membership, jornada, descanso, conflitos e cobertura na decisao.
4. Efetivar todos os deltas em uma transacao ou nenhum.
5. Invalidar propostas concorrentes/stale e notificar envolvidos/gestao.
6. Preservar antes/depois e decisao sem delete.

## Acceptance Criteria
1. Aceite/aprovacao produz nova escala efetiva atomica e auditavel.
2. Duas pessoas nao assumem o mesmo intervalo por corrida.
3. Oferta expirada, alterada ou inelegivel nao e aprovada por retry.
4. Deep links abrem exatamente a negociacao ou fallback autorizado.

## Validacao
- comandos/checks: state machine, concorrencia Postgres, RBAC, notificacao e E2E.
- revisao manual: oferta aberta, troca direta, aprovacao, recusa, expiracao e corrida.

## Riscos
- Deadlock ao trocar dois snapshots e suas Pausas associadas.

## Proximo passo provavel
TASK-AT-401

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: ordem de locks deterministica e decisao transacional.

