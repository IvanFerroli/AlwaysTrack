# TASK-AT-056 - Logo and button overflow polish

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-056-logo-and-button-overflow-polish.md

## Modo
- mode: visual-polish

## Objetivo unico
Corrigir regressao visual em que o logo lateral nao aparece e textos de botoes/listas da Wiki/FAQ estouram seus containers.

## Contexto minimo
O app recebeu novo pacote de logos em `apps/web/public/favicon/`. A sidebar estava usando `favicon.svg`, que referencia PNG internamente e pode renderizar em branco. Na Wiki/FAQ, botoes de paginas, threads e acoes longas nao quebravam texto bem dentro do container.

## Entrega
- `BrandMark` passa a usar `/favicon/favicon-512.png` diretamente.
- CSS de botoes permite quebra de linha balanceada e `overflow-wrap`.
- Botoes/listas de Wiki/FAQ (`wiki-page-button`, `wiki-chip-list`) passam a respeitar largura do container.
- Acoes em linha deixam de forcar altura fixa quando o texto precisar quebrar.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- Revisao visual em sidebar, Wiki e FAQ.

## Riscos
- Botoes com texto longo podem ficar mais altos; isso e preferivel a estourar layout.
