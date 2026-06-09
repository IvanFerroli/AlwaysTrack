# EXEC-AT-026 - Sales document approval workflow

## Metadata
- task-id: AT-037
- execution-id: EXEC-AT-026
- mode: runtime
- execution-mode: orchestrator
- specialist: codex
- status: completed
- date: 2026-06-08

## Sequencia operacional aplicada
1. Revisado o contrato atual de `GET /v1/sales/documents` e `PATCH /v1/sales/documents/:documentId/review`.
2. Estendido o filtro de listagem de notas com periodo operacional por data de envio (`createdAt`), preservando os filtros existentes por status, vendedor e grupo.
3. Mantido ranking/extratos usando periodo fiscal por `issuedAt`, para nao misturar a data operacional da fila com apuracao comercial.
4. Adicionado `reviewNote` ao payload de revisao e registro em auditoria; rejeicoes continuam persistindo `rejectionReason`.
5. Atualizada a tela Notas com filtros por data, vendedor e status, limpeza de filtros, selecao multipla, select all visivel, acoes de linha para aceitar/negar/revisar/reprocessar, acoes em lote para aprovar/rejeitar notas selecionadas e comentario operacional no editor.
6. Adicionados testes de parser, filtros da fila, auditoria do comentario operacional e cobertura esperada para estados de selecao/lote quando aplicavel.
7. Atualizacao documental paralela em 2026-06-08 registrou selecao multipla, select all visivel e acoes em lote, sem alteracao de runtime.

## Artefatos materiais
1. `services/api/src/core/sales-documents/sales-documents.service.ts`
2. `services/api/src/core/sales-documents/sales-documents.service.test.ts`
3. `apps/web/src/main.tsx`
4. `apps/web/src/styles.css`
5. `docs/tasks/EXEC-AT-026-sales-document-approval-workflow.md`
6. `docs/tasks/TASK-AT-037-sales-document-approval-workflow.md`

## Evidencias observaveis
1. `GET /v1/sales/documents` aceita `from`, `to`, `sellerProfileId` e `status`.
2. A tela Notas exibe filtros operacionais por periodo de envio, vendedor e status.
3. A fila permite selecao multipla de notas e mantem select all visivel para o recorte exibido.
4. Notas selecionadas podem receber acoes em lote de aprovacao ou rejeicao, preservando as mesmas regras das acoes individuais.
5. Notas `PENDING_REVIEW` exibem acoes `Aceitar`, `Negar`, `Revisar` e `Reprocessar IA`.
6. O editor de revisao permite inserir comentario operacional.
7. Comentario operacional de aprovacao/rejeicao fica rastreavel em `AuditLog.metadataJson`.

## Validacao
1. `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts` - passou, 17 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `npm run typecheck --workspace @alwaystrack/web` - passou.
4. Validacao documental em 2026-06-08: lidos `TASK-AT-037` e `EXEC-AT-026`; escopo atualizado para selecao multipla, select all visivel e acoes em lote de aprovar/rejeitar notas; nenhum runtime alterado nesta revisao.

## Riscos e ressalvas
1. Sem migration nesta leva: comentario operacional de aprovacao fica em auditoria, nao em campo proprio da nota.
2. O filtro de vendedor usa opcoes derivadas das notas carregadas; um endpoint dedicado de vendedores deve entrar no CRUD administrativo (`TASK-AT-039`) ou no gate de ranking se necessario.
3. Select all deve comunicar se opera sobre pagina/recorte visivel ou todos os resultados filtrados, para evitar acao em lote acidental.
4. Aprovacao/rejeicao em lote deve reportar sucesso parcial e notas inelegiveis sem ocultar falhas por permissao, status ou duplicidade.
5. Validacao manual com pacote real ainda depende da correcao de dedupe/reprocessamento (`TASK-AT-038`) e do gate de ranking (`TASK-AT-046`).

## Nota para proximo ciclo
Rodar `TASK-AT-046` depois que houver dados suficientes ou seguir para `TASK-AT-038` se a duplicata falsa continuar bloqueando a aprovacao real das notas.
