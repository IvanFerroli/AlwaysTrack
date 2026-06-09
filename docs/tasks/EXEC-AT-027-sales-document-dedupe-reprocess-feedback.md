# EXEC-AT-027 - Sales document dedupe and reprocess feedback

## Metadata
- task-id: AT-038
- execution-id: EXEC-AT-027
- mode: runtime
- execution-mode: orchestrator
- specialist: codex
- status: completed-partial
- date: 2026-06-08

## Sequencia operacional aplicada
1. Revisado o fluxo de upload deterministico, dedupe por `accessKey` e reprocessamento por `POST /v1/sales/documents/:documentId/analyze`.
2. Adicionado dedupe interno do pacote deterministico: chaves repetidas dentro da mesma extracao nao criam uma segunda nota `DUPLICATE`.
3. Mantida a protecao de duplicidade real contra outro documento ja existente na mesma organizacao.
4. Enriquecido o retorno do reprocessamento com provider, modelo, origem IA/deterministica, status final, chave mascarada, contagem de itens e warnings.
5. Adicionado feedback visivel na tela Notas apos `Extrair`/`Reprocessar IA`.
6. Adicionada cobertura de teste para dedupe interno por chave e retorno rico do reprocessamento.

## Artefatos materiais
1. `services/api/src/core/sales-documents/sales-documents.service.ts`
2. `services/api/src/core/sales-documents/sales-documents.service.test.ts`
3. `apps/web/src/main.tsx`
4. `apps/web/src/styles.css`
5. `docs/tasks/EXEC-AT-027-sales-document-dedupe-reprocess-feedback.md`

## Evidencias observaveis
1. Upload deterministico com chaves repetidas no mesmo pacote passa a pular repeticoes internas em vez de materializar uma nota `DUPLICATE` no banco.
2. Logs de upload incluem `skippedDuplicateAccessKeys`.
3. `Reprocessar IA` passa a mostrar feedback operacional com status, provider/model, origem, itens, chave mascarada e warnings.
4. O endpoint de reprocessamento retorna `extraction` alem de `document`, `duplicate` e `warnings`.

## Validacao
1. `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts` - passou, 18 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `npm run typecheck --workspace @alwaystrack/web` - passou.
4. `npm run build --workspace @alwaystrack/web` - passou.

## Riscos e ressalvas
1. O pacote real do usuario ainda precisa ser reexecutado para provar se a duplicata falsa vinha de repeticao interna do parser/pacote ou de outra camada.
2. Se houver duplicidade fiscal real entre arquivos diferentes, o sistema continua marcando/bloqueando como duplicidade.
3. O bulk de aprovacao da `AT-037` roda sequencialmente e ainda nao tem relatorio de sucesso parcial por nota.

## Nota para proximo ciclo
Reexecutar upload com o pacote real em DB limpo. Se ainda aparecer `DUPLICATE`, investigar split de pagina, chave extraida por pagina e eventual repeticao do arquivo de origem.
