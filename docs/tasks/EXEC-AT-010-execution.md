# EXEC-AT-010 - NF-e XML deterministic extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-05-30
- source-of-truth: docs/tasks/EXEC-AT-010-execution.md

## Escopo
Adicionar XML NF-e como caminho deterministico preferencial para reduzir custo e variacao de layout na extracao comercial.

## Entregue
1. Upload comercial aceita `application/xml` e `text/xml`.
2. Front aceita `.xml` e infere MIME de XML quando o browser nao informa `file.type`.
3. Parser `deterministic-nfe-xml` com modelo `xml-v1`.
4. Mapeamento de `infNFe`, `ide`, `emit`, `dest`, `total/ICMSTot` e `det/prod` para o mesmo contrato `SalesDocumentAiResult`.
5. Persistencia existente em `SalesDocument`, `SalesDocumentExtraction` e `SalesItem` reaproveitada sem migration.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- `npm run smoke:beta-local`
- Smoke manual via API local: XML NF-e criou nota `PENDING_REVIEW` com provider `deterministic-nfe-xml`, item e total preenchidos.

## Residual
- Nao ha suporte a ZIP/lote de XMLs.
- XML com schemas exoticos pode exigir parser estruturado dedicado.
- Editor granular de campos/itens continua em `AT-018B`.
