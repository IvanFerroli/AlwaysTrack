# SPEC-009 - Application Tracking

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-009-application-tracking.md

## Objetivo unico
Rastrear ciclo de aplicação aprovada até desfecho operacional.

## Fronteira
- inclui: `GET /v1/applications`, `POST /v1/applications/update-status`.
- nao inclui: integração com ATS externo para status automático.

## Contrato observavel
- entrada: `UpdateApplicationStatusInput` (`interview` ou `rejected`).
- saida: `ApplicationRecord` atualizado.
- pre-condicao: aplicação criada via aprovação executada.

## Limites
- estados suportados no baseline: `submitted`, `interview`, `rejected`.
- sem trilha de múltiplos eventos por aplicação além do estado final atual.

## Observabilidade minima
- atualizações registram `outcomeBy`, `outcomeAt`, `outcomeReason`.
- listagem ordenada por `submittedAt`.

## Acceptance Criteria
1. Aplicações aprovadas aparecem na listagem.
2. Update para `interview/rejected` persiste evidência de operador/motivo.
3. Status inválido é rejeitado com erro controlado.

## Definition of Done
1. Fluxo de acompanhamento pós-approve operacional.
2. Testes cobrem transição de status e validações.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/execution/execution.service.test.ts`
- revisao manual:
  - atualizar status de aplicação e conferir listagem.

## Evidencia esperada
- registro de aplicação com `status` atualizado.
- erro para transição inválida.

## Riscos e mitigacao
- risco: update concorrente sobrescrever evidência.
- mitigacao: manter atualização atômica por id em store.
