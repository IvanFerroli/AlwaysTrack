# TASK-AT-370 - Troca atomica de pausas entre atendentes

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-370-sac-pause-atomic-swaps.md

## Modo
- mode: implementation

## Objetivo unico
Implementar solicitacao, aceite, recusa, expiracao e cancelamento de troca de dois slots confirmados.

## Contexto minimo
Troca nao pode ser uma sequencia de dois cancelamentos/reservas, pois uma falha intermediaria perderia vaga ou quebraria capacidade.

## Dependencias
- satisfeitas: TASK-AT-369.
- em aberto: n/a.

## Alvos explicitos
1. Modelo e maquina de estados de swap.
2. APIs de propor, responder, cancelar e listar.
3. UI de troca para os dois atendentes.

## Fora de escopo
- Marketplace anonimo de slots.
- Transferencia unilateral sem aceite.

## Checklist
1. Vincular proposta a duas reservas vigentes e ao mesmo tenant.
2. Revalidar elegibilidade/capacidade dos dois lados no aceite.
3. Efetivar a troca em uma unica transacao.
4. Invalidar proposta expirada, concorrente ou com reserva alterada.
5. Notificar envolvidos de forma deduplicada e auditavel.

## Acceptance Criteria
1. Aceite troca os titulares de forma atomica ou nao altera nenhum deles.
2. Somente o destinatario aceita/recusa e somente envolvidos consultam detalhe.
3. Propostas paralelas nao produzem dupla titularidade.
4. Historico mostra slots e titulares antes/depois sem apagar reservas.

## Validacao
- comandos/checks: testes de state machine, concorrencia, HTTP, notificacao e Web.
- revisao manual: aceitar, recusar, expirar e disputar duas propostas.

## Riscos
- Deadlock ou estado pendente eterno em duas trocas concorrentes.

## Proximo passo provavel
TASK-AT-371

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: manter troca bilateral e transacional.
