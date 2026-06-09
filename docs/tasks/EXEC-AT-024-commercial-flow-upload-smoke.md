# EXEC-AT-024 - Commercial flow upload smoke

## Metadata
- task-id: TASK-AT-026
- execution-id: EXEC-AT-024
- mode: runtime
- execution-mode: batch-worker
- orchestrator: olympus_orchestrator
- specialist: worker
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Revisado o fluxo legado em `main-flow.e2e.test.ts` e os contratos determinísticos existentes de DANFE/NF-e.
2. Adicionado smoke comercial pequeno no fluxo principal com Prisma, storage e PDF parser em memória.
3. Exercitado upload XML NF-e e upload PDF textual DANFE pela extração determinística, ambos chegando a `PENDING_REVIEW`.
4. Aprovado o documento XML e consultados ranking e statements no mesmo estado em memória.
5. Validado que o documento PDF pendente mantém itens extraídos, mas fica fora de ranking/statements aprovados.

## Artefatos materiais
1. `services/api/src/core/quality/main-flow.e2e.test.ts`
2. `docs/tasks/EXEC-AT-024-commercial-flow-upload-smoke.md`

## Evidências observáveis
1. `npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts` - passou; 2 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. Logs do teste registraram `sales_document.upload.deterministic_detected` para `deterministic-nfe-xml` e `deterministic-pdf-text`, ambos com `usedAi:false`.
4. Ranking retornou apenas a nota aprovada com total `19453`, quantidade `5` e `documents:1`.
5. Statements retornou `summary.documents:1`, mantendo o DANFE PDF em `PENDING_REVIEW` fora do consolidado.

## Blockers
Nenhum.

## Nota para próximo ciclo
O smoke usa mock local de `pdf-parse` para simular um PDF textual e manter o teste determinístico sem fixture binária pesada. Um próximo ciclo pode adicionar smoke HTTP real via `scripts/smoke-beta-local.js` quando houver seed comercial estável para upload/review end-to-end.
