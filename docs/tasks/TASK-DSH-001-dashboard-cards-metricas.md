# TASK-DSH-001 - Dashboard cards e metricas

## Metadata
- status: proposed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-DSH-001-dashboard-cards-metricas.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar cards principais do dashboard com dados reais do banco.

## Inputs
- documento central, secao 7.1

## Dependencias
- satisfeitas: `TASK-LIC-002`, `TASK-FIL-004`, `TASK-NOT-004`, `TASK-UX-001`
- em aberto: n/a

## Alvos explicitos
1. endpoint de metricas
2. cards no dashboard

## Fora de escopo
- BI avancado

## Acceptance Criteria
1. Mostra total de profissionais, licencas regulares/a vencer/vencidas.
2. Mostra documentos aguardando validacao.
3. Mostra notificacoes pendentes/enviadas/falhas.
4. Dados respeitam escopo do usuario.

## Validacao
- testes de agregacao
- smoke manual com seed

## Riscos
- metricas ignorarem permissoes
