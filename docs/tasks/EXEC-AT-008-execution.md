# EXEC-AT-008 - Deterministic-first DANFE pivot

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-05-30
- source-of-truth: docs/tasks/EXEC-AT-008-execution.md

## Escopo
Pivotar o fluxo de DANFE para rodar magro: extracao deterministica primeiro, IA apenas como fallback, e revisao baseada nos dados persistidos no Prisma.

## Entregue
1. `AT-028`: parser deterministico de DANFE PDF textual.
2. Upload com tentativa automatica de extracao antes da revisao.
3. Persistencia imediata de campos e itens em `SalesDocument` e `SalesItem`.
4. Suporte inicial a PDF com multiplas DANFEs no mesmo arquivo.
5. Visibilidade permanente de dados extraidos na tela de Notas.
6. Botao de reprocessamento por IA para revisores quando a leitura deterministica precisar de segunda opiniao.
7. Warning operacional quando total da nota diverge da soma dos itens lidos.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- `npm run smoke:beta-local`
- PDF real `danfe_2026-05-22_09_40_33.pdf`: 28 DANFEs completas extraidas via `deterministic-pdf-text`, sem IA.

## Residual
- Adicionar XML NF-e como caminho deterministico preferencial.
- Criar editor visual de campos/itens para revisao manual.
- PDF escaneado ou imagem ainda precisa de fallback IA/manual.
- Formalizar contrato de resposta para upload multi-DANFE.
