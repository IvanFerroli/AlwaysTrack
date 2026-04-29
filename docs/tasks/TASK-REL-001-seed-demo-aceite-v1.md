# TASK-REL-001 - Seed, demo e aceite final da V1

## Metadata
- status: proposed
- owner: orchestrator
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-REL-001-seed-demo-aceite-v1.md

## Modo
- mode: verification

## Agentes sugeridos
- `olympus_orchestrator`
- `olympus_taskyfier`
- quality builder
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Preparar demo realista e comprovar que os 14 criterios de sucesso da V1 foram atendidos.

## Inputs
- documento central, secao 20
- todas as tasks anteriores

## Dependencias
- satisfeitas: `TASK-QLT-004`, `TASK-DEP-002`
- em aberto: dados ficticios aprovados para demo

## Alvos explicitos
1. seed de demo
2. checklist de aceite
3. roteiro curto de apresentacao
4. relatorio final de gaps

## Fora de escopo
- features futuras
- call center

## Acceptance Criteria
1. Todos os 14 criterios de sucesso sao demonstraveis.
2. Dashboard, relatorios, notificacoes, upload, validacao e auditoria funcionam no mesmo ambiente.
3. Gaps restantes sao classificados como bloqueadores ou pos-V1.
4. Projeto nao depende de planilha como fonte principal.

## Validacao
- execucao do roteiro de demo
- `npm run check`
- E2E principal verde

## Riscos
- demo mascarar falha operacional real
