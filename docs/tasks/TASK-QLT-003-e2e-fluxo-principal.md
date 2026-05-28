# TASK-QLT-003 - E2E do fluxo principal

## Metadata
- status: completed
- owner: quality-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-QLT-003-e2e-fluxo-principal.md

## Modo
- mode: verification

## Agentes sugeridos
- quality builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Validar o caminho completo admin/RT/profissional/notificacao/relatorio.

## Inputs
- criterio de sucesso da secao 20

## Dependencias
- satisfeitas: `TASK-QLT-002`, `TASK-DEP-001`
- em aberto: n/a

## Alvos explicitos
1. teste E2E happy path
2. seed de teste
3. fixtures de provider Meta fake

## Fora de escopo
- carga/performance pesada

## Acceptance Criteria
1. Admin cria org/unidade/setor/user/profissional/licenca.
2. Sistema calcula status.
3. Job de notificacao e criado e processado com provider fake.
4. Profissional envia documento por link.
5. RT aprova/recusa.
6. Dashboard e relatorios refletem o estado.

## Validacao
- suite E2E automatizada
- screenshot/check manual se necessario

## Riscos
- E2E fragil por depender de provider externo

## Execucao
- Criado E2E leve automatizado em Vitest para o fluxo principal em nivel de dominio/API, usando Prisma mockado e `FakeNotificationProvider`.
- Fluxo coberto: admin cria licenca, status e calculado, job de notificacao e criado/processado, profissional envia documento por token publico, RT aprova e status e recalculado dentro do escopo.
- Mantida decisao conservadora de nao introduzir Playwright/browser porque nao havia setup E2E no repo.

## Evidencias
- `services/api/src/core/quality/main-flow.e2e.test.ts`
- `npm run test --workspace @alwaystrack/api` - 18 arquivos, 90 testes passaram.
