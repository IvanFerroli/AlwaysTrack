# EXEC-AT-012 - Wiki Markdown editor MVP

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-012-wiki-markdown-editor-mvp.md

## Escopo
Implementar o primeiro lote da Wiki rica: formato Markdown seguro, toolbar de edicao e leitura bonita sem adicionar dependencia pesada.

## Entregue
1. `AT-029`: API sintetiza `contentFormat: MARKDOWN` para paginas, revisoes e requisicoes.
2. `AT-030`: editor Markdown com toolbar em criacao, edicao admin e sugestao de nao-admin.
3. `AT-031`: renderer React para leitura/preview sem `dangerouslySetInnerHTML`.
4. `AT-036` parcial: teste de service para formato e renderizacao segura por construcao React.
5. Preview renderizado na comparacao de revisoes e na fila de moderacao.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`
- `npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- `npm run smoke:beta-local`

## Residual
- Upload de imagens/anexos fica em `AT-032`.
- Review rico com diff visual mais detalhado fica em `AT-033`.
- Extrair componentes da Wiki para fora de `main.tsx` deve entrar em uma rodada de organizacao quando a UI estabilizar.
- Sumario por headings ainda nao foi implementado.
