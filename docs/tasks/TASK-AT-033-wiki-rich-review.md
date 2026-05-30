# TASK-AT-033 - Wiki rich review

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-033-wiki-rich-review.md

## Objetivo
Melhorar a moderacao da Wiki para conteudo formatado, imagens e mudancas maiores.

## Escopo
- Preview renderizado da proposta.
- Comparacao por blocos/linhas de Markdown.
- Destaque de imagens adicionadas/removidas.
- Mensagem clara quando a versao base ficou desatualizada.
- Aprovar/reprovar mantendo auditoria e historico.

## Aceite
- Admin revisa conteudo renderizado antes de aprovar.
- Admin ve resumo de mudancas em vez de apenas texto cru.
- Conflito de versao mostra publicada atual, base da proposta e proposta.
- Aprovacao continua respeitando `baseVersion`.

## Riscos
- Diff visual errado induzir aprovacao ruim.
- Imagens em propostas aprovadas precisam continuar disponiveis.
- Comparacao rica pode ficar pesada se tentar ser perfeita no MVP.
