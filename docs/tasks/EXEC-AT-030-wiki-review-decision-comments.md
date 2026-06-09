# EXEC-AT-030 - Wiki review decision comments

## Metadata
- task-id: AT-041
- execution-id: EXEC-AT-030
- mode: runtime
- execution-mode: orchestrator
- specialist: codex
- status: completed
- date: 2026-06-08

## Sequencia operacional aplicada
1. Revisado o fluxo de moderacao Wiki e confirmado que `decisionNote` ja existia no schema e no payload.
2. Mantido campo de nota de decisao no painel admin de moderacao.
3. Adicionada exibicao de historico recente de decisoes aprovadas/rejeitadas para admin, incluindo comentario, revisor e data.
4. Adicionada exibicao das decisoes das propostas do autor no detalhe da pagina, incluindo comentario, revisor e data.
5. Adicionada cobertura de rejeicao com `decisionNote`, alem da aprovacao ja coberta.

## Artefatos materiais
1. `apps/web/src/main.tsx`
2. `apps/web/src/styles.css`
3. `services/api/src/core/wiki/wiki.service.test.ts`
4. `docs/tasks/EXEC-AT-030-wiki-review-decision-comments.md`

## Evidencias observaveis
1. Admin ve historico recente de requisicoes aprovadas/rejeitadas com nota de decisao.
2. Autor da proposta ve comentarios de decisao nas proprias propostas revisadas.
3. Auditoria de approve/reject ja inclui `decisionNote`.

## Validacao
1. `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts` - passou, 18 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `npm run typecheck --workspace @alwaystrack/web` - passou.
4. `npm run build --workspace @alwaystrack/web` - passou.

## Riscos e ressalvas
1. O historico admin mostra amostra recente de ate 12 decisoes, nao uma tela paginada completa.
2. Comentario segue opcional para aprovacao e rejeicao.

## Nota para proximo ciclo
Quando `TASK-AT-044` entrar, usar esses eventos de decisao como origem para notificacoes in-app.
