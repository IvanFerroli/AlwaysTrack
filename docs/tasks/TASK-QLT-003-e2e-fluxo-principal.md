# TASK-QLT-003 - E2E do fluxo principal

## Metadata
- status: proposed
- owner: quality-builder
- last-updated: 2026-04-29
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
- em aberto: ambiente E2E

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
