# TASK-QLT-002 - Testes de dominio e integracao

## Metadata
- status: completed
- owner: quality-builder
- last-updated: 2026-04-30
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

## Execucao
- Suite de dominio/integracao reforcada em API.
- Adicionado teste para falha/retry de provider de notificacao com log normalizado.
- Mantida cobertura existente para status de licenca, tokens/upload, relatorios, roles, documentos, auth, auditoria e jobs.

## Evidencias
- `npm run test --workspace @sylembra/api` - 18 arquivos, 90 testes passaram.
- `services/api/src/core/notifications/notifications.service.test.ts`
- `services/api/src/core/quality/main-flow.e2e.test.ts`
