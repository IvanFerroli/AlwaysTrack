# TASK-REL-001 - Seed, demo e aceite final da V1

## Metadata
- status: completed
- owner: orchestrator
- last-updated: 2026-04-30
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
- em aberto: n/a

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

## Execucao
- Seed de demo ampliado com organizacao, unidade, setor, admin, RT, supervisor, profissionais e licencas em cenarios `REGULAR`, `EXPIRING` e `EXPIRED`.
- Seed inclui documentos aprovado/pendente/recusado, token publico de demo, notificacoes fake com status `SENT` e `FAILED`, logs e auditoria.
- Criado checklist dos 14 criterios, roteiro curto de apresentacao e relatorio de gaps.
- Credenciais Meta reais ficaram explicitamente fora do escopo desta execucao; demo usa provider `fake` ate preenchimento privado da `.env`.

## Evidencias
- `services/api/prisma/seed.ts`
- `docs/operations/v1-demo-acceptance-2026-04-30.md`
- `npm run prisma:seed`
- `npm run check`
