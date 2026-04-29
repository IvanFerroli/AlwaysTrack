# TASK-QLT-002 - Testes de dominio e integracao

## Metadata
- status: proposed
- owner: quality-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-QLT-002-testes-dominio-integracao.md

## Modo
- mode: verification

## Agentes sugeridos
- quality builder
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Cobrir regras criticas de dominio e integracoes internas antes do E2E final.

## Inputs
- tasks de dominio implementadas

## Dependencias
- satisfeitas: `TASK-RPT-006`
- em aberto: n/a

## Alvos explicitos
1. testes de status de licenca
2. testes de token/upload
3. testes de notificacao/job
4. testes de relatorios

## Fora de escopo
- testes visuais extensos

## Acceptance Criteria
1. Regras de vencimento e validacao estao protegidas.
2. Retry/webhook possuem testes.
3. Permissoes por role possuem cobertura.

## Validacao
- `npm run test`
- `npm run check`

## Riscos
- teste testar mock demais e comportamento real de menos
