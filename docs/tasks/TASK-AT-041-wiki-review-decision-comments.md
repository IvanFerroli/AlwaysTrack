# TASK-AT-041 - Wiki review decision comments

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-08
- source-of-truth: docs/tasks/TASK-AT-041-wiki-review-decision-comments.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que admin adicione comentario/nota de decisao ao aprovar ou rejeitar mudancas da Wiki, e tornar essa nota visivel no historico da requisicao.

## Contexto minimo
A Wiki ja possui revisao/comparacao rica e o modelo `WikiEditRequest.decisionNote`, com parsing no service. O pedido atual exige que, ao aprovar ou rejeitar mudancas/revisoes, seja possivel adicionar comentario/nota de decisao de forma clara para quem revisa e para quem enviou a proposta.

## Inputs
- Pedido do usuario em 2026-06-08.
- `docs/specs/SPEC-AT-003-wiki-collaborative-review.md`
- `docs/tasks/TASK-AT-033-wiki-rich-review.md`
- `docs/tasks/EXEC-AT-016-wiki-rich-review-mvp.md`
- `services/api/src/core/wiki/*`
- `apps/web/src/main.tsx`

## Dependencias
- satisfeitas: fila de moderacao Wiki, `decisionNote` no schema, endpoints approve/reject, auditoria `wiki.request.approve` e `wiki.request.reject`.
- em aberto: confirmar se a UI atual envia uma nota vazia por `window.prompt` ou nao envia nota recuperavel.

## Alvos explicitos
1. `apps/web/src/main.tsx`: campo de comentario/nota de decisao no painel de moderacao.
2. `services/api/src/core/wiki/wiki.service.ts`: validar/persistir nota ja existente sem regressao.
3. `services/api/src/core/wiki/wiki.service.test.ts`: cobertura de aprovacao e rejeicao com `decisionNote`.
4. `apps/web/src/styles.css`: ajuste visual pequeno para campo de decisao e exibicao historica.

## Fora de escopo
- Comentarios inline por bloco de Markdown.
- Discussao completa por thread dentro da Wiki.
- Merge manual de conflitos.
- Notificacoes sobre a decisao; isso pertence a `TASK-AT-044`.

## Checklist
1. Revisar o fluxo atual de `decideRequest` e confirmar onde `decisionNote` se perde ou fica pouco visivel.
2. Adicionar entrada de comentario no card/painel de cada requisicao pendente.
3. Enviar `decisionNote` ao aprovar e ao rejeitar, permitindo comentario opcional em aprovacao e recomendado ou exigido em rejeicao conforme decisao de produto.
4. Exibir `decisionNote`, revisor e data nas requisicoes ja revisadas quando carregadas.
5. Garantir que a nota entre na auditoria existente sem vazar para outra organizacao.
6. Preservar bloqueio por `baseVersion` e status `PENDING`.
7. Adicionar teste de service para persistencia da nota nas duas decisoes.
8. Fazer validacao manual com aprovacao e rejeicao contendo notas diferentes.

## Acceptance Criteria
1. Admin consegue digitar uma nota antes de aprovar uma requisicao da Wiki.
2. Admin consegue digitar uma nota antes de rejeitar uma requisicao da Wiki.
3. A nota fica persistida em `WikiEditRequest.decisionNote`.
4. A nota aparece no detalhe/listagem historica da requisicao revisada.
5. Autor da proposta consegue ver a nota da decisao dentro do seu escopo de organizacao.
6. Auditoria de approve/reject inclui a nota ou referencia segura a ela.
7. Aprovacao continua criando nova revisao somente quando `baseVersion` ainda e atual.
8. Rejeicao continua sem alterar a pagina publicada.

## Definition of Done
1. UI de moderacao coleta e exibe comentario de decisao.
2. Backend/testes confirmam persistencia de `decisionNote`.
3. Comportamento de aprovacao/rejeicao existente permanece intacto.
4. Validacao automatizada e manual documentada no EXEC correspondente.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`, `npm run typecheck --workspace @alwaystrack/api`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`
- revisao manual: usuario nao-admin envia proposta; admin aprova com nota; outra proposta e rejeitada com nota; autor visualiza o comentario de decisao.

## Evidencia esperada
- Teste de approve/reject com `decisionNote`.
- Print ou relato do painel de moderacao com nota preenchida.
- Print ou relato de requisicao revisada mostrando comentario, revisor e data.

## Riscos
- Nota obrigatoria em aprovacao pode atrasar fluxo operacional; preferir opcional se nao houver decisao contraria.
- Nota vazia pode gerar falsa sensacao de feedback; microcopy deve deixar claro quando nao houver comentario.
- Campo muito longo pode degradar card de moderacao; definir limite razoavel se ainda nao existir.

## Blockers possiveis
- UI atual carregar apenas pendencias e nao expor historico revisado onde a nota possa ser vista.
- Necessidade de filtro/status adicional para listar requisicoes aprovadas/rejeitadas pelo autor.

## Retorno esperado
- resumo curto da nota de decisao entregue
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Execucao
- `EXEC-AT-030-wiki-review-decision-comments.md`
