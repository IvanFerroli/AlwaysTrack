# EXEC-AT-071 - Timeline visual da nota

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- source-task: `TASK-AT-071-sales-document-visual-timeline.md`

## Resumo
Criada timeline visual por DANFE/nota, agregando dados do documento, extracoes e eventos de auditoria existentes.

## Implementacao
1. Adicionado endpoint `GET /v1/sales/documents/:documentId/timeline`.
2. Criado servico `getSalesDocumentTimeline` com eventos de envio, upload auditado, extracao, duplicidade/falha, aprovacao/rejeicao e impacto comercial.
3. Adicionado botao `Timeline` na tabela de Notas.
4. Criado painel visual com linha do tempo, autor, status, data/hora e detalhe em linguagem operacional.
5. Adicionado teste unitario cobrindo documento, extracao e auditoria ordenados.
6. Criada `TASK-AT-082` para a futura aba de Avisos/comunicados internos.

## Arquivos principais
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `services/api/src/core/sales-documents/sales-documents.service.test.ts`
- `services/api/src/app.ts`
- `apps/web/src/views/notes.tsx`
- `apps/web/src/sales.ts`
- `apps/web/src/styles.css`
- `docs/tasks/TASK-AT-082-announcements-center.md`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run build --workspace @alwaystrack/web`

## Riscos e proximos passos
- Eventos antigos sem auditoria detalhada aparecem via fallback do documento/extracao.
- Diagnostico de DANFE (`TASK-AT-073`) deve aprofundar arquivo original, erros e correcao manual.
- A task de Avisos (`TASK-AT-082`) ainda esta apenas formalizada, sem implementacao.

