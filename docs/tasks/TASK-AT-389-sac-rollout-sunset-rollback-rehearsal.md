# TASK-AT-389 - Rollout, sunset e rollback ensaiado SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-389-sac-rollout-sunset-rollback-rehearsal.md

## Modo
- mode: migration

## Objetivo unico
Executar rollout faseado, sunset da ponte de Vendas e rollback de codigo/configuracao sem perda de dados novos ou legados.

## Contexto minimo
Migracoes aditivas, freeze de rotas e novas superficies precisam de ordem operacional. Rollback nao pode depender de remover tabelas nem reabrir escrita comercial silenciosamente.

## Dependencias
- satisfeitas: TASK-AT-365 a TASK-AT-388.
- em aberto: janela, owners e ambiente production-like/live autorizados.

## Alvos explicitos
1. Flags de Pausas, Performance, Campanhas e leitura legada.
2. Plano expand/backfill/dual-read controlado/cutover/sunset.
3. Ensaio de backup, restore, rollback e reconciliacao.

## Fora de escopo
- Executar cutover live sem aprovacao.
- Downgrade destrutivo de schema.

## Checklist
1. Fazer preflight de backup, contagens, jobs, consumidores e capacidade.
2. Habilitar por tenant/time canario com criterios de abort.
3. Observar invariantes, alertas e uso residual das rotas antigas.
4. Retirar navegacao antes do sunset final e comunicar prazo da ponte.
5. Ensaiar rollback de app/flags preservando dados SAC e `SALES_LEGACY`.
6. Reconciliar depois do cutover e registrar decisoes GO/NO-GO.

## Acceptance Criteria
1. Cada fase possui owner, duracao, metrica, abort e passo de rollback.
2. Rollback nao perde booking, revisao, campanha ou historico comercial.
3. Reabrir escrita de Vendas exige decisao explicita separada.
4. Sunset so ocorre sem consumidor nao autorizado e com exportacao validada.

## Validacao
- comandos/checks: rehearsal production-like, backup/restore, smoke por role e checksums antes/depois.
- revisao manual: tabletop de incidente durante booking, importacao e cutover.

## Riscos
- Rollback de binario antigo nao entender colunas/estados aditivos novos.

## Proximo passo provavel
TASK-AT-390

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nenhuma promocao live por inferencia de evidencia local.
