# SPEC-008 - Strategy Approval Gate

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-008-strategy-approval-gate.md

## Objetivo unico
Transformar score em proposta de ação com gate humano obrigatório para aplicação.

## Fronteira
- inclui: `POST /v1/strategy/propose`, `GET /v1/approval-queue`, `POST /v1/approval-queue/approve`, `POST /v1/approval-queue/reject`.
- nao inclui: envio real externo de candidatura.

## Contrato observavel
- entrada: `StrategyProposalInput` e ações de approve/reject.
- saida: `StrategyProposalResult` e `ApprovalRequest`.
- regras:
  - só propõe quando score >= threshold.
  - evita duplicidade de aprovação/aplicação para mesmo par vaga+profile.

## Limites
- proposta é recomendação assistida, não execução automática externa.
- aprovação depende de operador humano.

## Observabilidade minima
- registro em `decision-logs` e `skill-executions` em todo fluxo.
- métricas incluem `strategyProposals` persistido.

## Acceptance Criteria
1. Proposta abaixo de threshold não abre approval.
2. Proposta válida abre/reusa approval pendente.
3. Approve/reject atualiza estado de fila de forma consistente.

## Definition of Done
1. Gate humano permanece obrigatório antes de aplicação.
2. Deduplicação de proposta/aplicação protegida por testes.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/strategy/strategy.service.test.ts src/features/execution/execution.service.test.ts`
- revisao manual:
  - propor estratégia e aprovar/rejeitar via endpoints.

## Evidencia esperada
- `approvalRequest` criado/reusado em casos válidos.
- fila refletindo status `pending|approved|rejected`.

## Riscos e mitigacao
- risco: propostas duplicadas em corrida.
- mitigacao: verificação de pendência/submissão existente antes de criar nova.
