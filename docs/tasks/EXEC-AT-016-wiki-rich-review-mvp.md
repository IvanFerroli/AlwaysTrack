# EXEC-AT-016 - Wiki rich review MVP

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-016-wiki-rich-review-mvp.md

## Objetivo
Concluir o MVP de review rico da Wiki para admins aprovarem conteudo formatado, imagens e propostas com conflito de versao com mais contexto.

## Tasks cobertas
- `TASK-AT-033-wiki-rich-review.md`

## Entregue
- API passa a retornar contexto de review nas requisicoes de edicao: versao/conteudo atual e conteudo da revisao base quando disponivel no historico carregado.
- Preview administrativo deixa de depender da pagina estar aberta para mostrar digest de mudancas.
- Conflitos mostram paineis de publicada atual, base da proposta e proposta.
- Digest explicita linhas adicionadas/removidas e imagens adicionadas/removidas.
- Aprovacao/reprovacao segue bloqueada por `baseVersion` na API.

## Validacao
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`

## Residual
- Diff segue por linhas normalizadas, sem highlight intralinha.
- Base muito antiga pode ficar fora do pacote curto de revisoes retornado para review.
- Ainda nao ha merge manual de conflito.
