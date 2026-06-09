# EXEC-AT-035 - Backlog final validation

## Metadata
- execution-id: EXEC-AT-035
- task: TASK-AT-046-commercial-ranking-validation-gate.md; TASK-AT-038-sales-document-ai-reprocess-feedback.md
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-09

## Objetivo
Fechar os dois residuais do backlog: validar ranking com multiplos vendedores e proteger o reprocessamento contra duplicidade falsa da propria nota.

## Arquivos alterados
1. `services/api/src/core/sales-documents/sales-documents.service.test.ts`
2. `docs/tasks/TASK-AT-046-commercial-ranking-validation-gate.md`
3. `docs/tasks/TASK-AT-038-sales-document-ai-reprocess-feedback.md`
4. `docs/tasks/ROADMAP.md`
5. `docs/operations/orchestrator-state.md`

## Entrega
1. O teste de ranking agora cobre tres vendedores:
   - Carla: R$ 500,00, 2 documentos, posicao 1.
   - Bruno: R$ 450,00, 1 documento, posicao 2.
   - Ana: R$ 200,00, 1 documento, posicao 3.
2. O teste confirma explicitamente que o ranking consulta somente documentos `APPROVED`.
3. O teste de reprocessamento idempotente cobre uma nota `PENDING_REVIEW` sendo reprocessada com `forceAi: true` e a mesma chave de acesso da propria nota.
4. A validacao confirma que o dedupe consulta outro documento com `id: { not: "doc-1" }`, nao a propria nota.
5. O resultado esperado e `duplicate: false`, status final `PENDING_REVIEW` e chave fiscal preservada.

## Decisao
O backlog ativo foi fechado com gates automatizados reproduziveis. O pacote real externo citado pelo usuario nao esta versionado no repositorio nem disponivel como fixture; se ele reaparecer com divergencia, isso deve virar novo bug com o arquivo/saidas concretas.

## Validacao
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`: passou, 20 testes.
- `npm run typecheck --workspace @alwaystrack/api`: passou.
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run check`: passou, 26 arquivos de teste e 170 testes.

## Riscos residuais
- Validacao automatizada nao substitui uma rodada exploratoria com o pacote real do usuario.
- Se o pacote real contiver DANFEs realmente repetidas, o sistema deve continuar sinalizando duplicidade real.
- O ranking foi validado no service; validacao visual manual ainda pode ser util antes de demo externa.
