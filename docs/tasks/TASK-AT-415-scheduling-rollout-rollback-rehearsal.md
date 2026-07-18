# TASK-AT-415 - Rollout e rollback ensaiados da nova frente

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-415-scheduling-rollout-rollback-rehearsal.md

## Modo
- mode: migration

## Objetivo unico
Estender TASK-AT-389 com rollout faseado e rollback de Escalas, Pausas subordinadas, targets tipados, overlays e Avisos recorrentes.

## Contexto minimo
Ativar Escalas muda a fonte de elegibilidade de Pausa; ativar scheduler pode emitir notificacoes. Cutover precisa de shadow/reconciliacao e flags independentes.

## Dependencias
- satisfeitas: TASK-AT-389 e TASK-AT-393 a TASK-AT-414.
- em aberto: janela, owners e ambientes autorizados.

## Alvos explicitos
1. Flags separadas de Escalas, Pausa efetiva, realtime, targets e recorrencia.
2. Plano expand/backfill/shadow/canary/cutover.
3. Ensaio de backup, restore, disable e reconciliacao.

## Fora de escopo
- Cutover live sem aprovacao.
- Rollback destrutivo de schema/ocorrencias.

## Checklist
1. Fazer preflight de memberships, pausas, regras, notificacoes e Avisos.
2. Materializar em shadow e comparar cobertura antiga/nova por janela.
3. Habilitar calendario/painel antes de tornar Escala fonte de Pausa.
4. Migrar targets com resolver/fallback antes de novos emissores.
5. Ativar recorrencia em dry-run/canario e controlar catch-up.
6. Ensaiar disable/rollback preservando snapshots, bookings e ocorrencias.

## Acceptance Criteria
1. Cada flag possui owner, metrica, abort e rollback.
2. Cutover de Pausa so ocorre apos reconciliacao sem conflito nao tratado.
3. Desabilitar scheduler/realtime nao apaga nem duplica dados ao retomar.
4. Rollback de app antigo nao interpreta estados novos de forma destrutiva.

## Validacao
- comandos/checks: rehearsal production-like, backup/restore, shadow diff, smoke por role e checksums.
- revisao manual: tabletop de troca/aprovacao, Pausa concorrente e scheduler durante rollback.

## Riscos
- Ativar scheduler com backlog antigo gerar tempestade de Avisos/notificacoes.

## Proximo passo provavel
TASK-AT-416

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nenhuma promocao live por evidencia local.

