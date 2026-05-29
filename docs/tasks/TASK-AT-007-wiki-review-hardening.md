# TASK-AT-007 - Wiki review hardening

## Metadata
- status: completed
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-007-wiki-review-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Reduzir atrito e risco da wiki MVP com comparacao de revisoes, rascunho local e preview de requisicoes antes da decisao admin.

## Contexto minimo
`TASK-AT-006` entregou a wiki funcional em `/wiki`, mas deixou residuos de UX: historico pouco acionavel, sem rascunho e moderacao sem previsualizacao clara do conteudo proposto.

## Inputs
- `docs/specs/SPEC-AT-003-wiki-collaborative-review.md`
- `services/api/src/core/wiki/wiki.service.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`

## Dependencias
- satisfeitas: schema/API/UI wiki MVP
- em aberto: diff semantico rico e colaboracao em tempo real

## Alvos explicitos
1. Historico comparavel entre revisao publicada e revisao anterior.
2. Rascunho local por usuario/pagina no navegador.
3. Preview de requisicao pendente antes de aprovar/reprovar.
4. Busca de requisicoes por pagina, autor ou conteudo no service.

## Fora de escopo
- Editor rich text.
- Merge automatico.
- WebSocket.

## Checklist
1. Expor dados suficientes para comparar revisoes. Status: completed.
2. Adicionar rascunho local na tela `/wiki`. Status: completed.
3. Adicionar preview de requisicoes na fila admin. Status: completed.
4. Cobrir filtro de requisicoes em teste de service. Status: completed.

## Acceptance Criteria
1. Usuario consegue salvar e recuperar rascunho local sem publicar.
2. Admin consegue selecionar uma requisicao e ler o conteudo proposto antes da decisao.
3. Tela mostra resumo simples de diferenca entre revisoes.
4. Teste de wiki cobre busca de requisicoes.

## Validacao
- comandos/checks: `npm run check`, `npm run build --workspace @alwaystrack/web`
- revisao manual: abrir `/wiki`, trocar revisao, salvar/descartar rascunho e usar preview admin

## Riscos
- Rascunho local fica restrito ao navegador e nao substitui rascunho persistente.
- Comparacao atual e linha-a-linha simples, nao diff visual completo.
