# TASK-AT-033 - Wiki rich review

## Metadata
- status: completed-partial
- owner: olympus_taskyfier
- last-updated: 2026-06-03
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

## Entregue parcial
- Preview renderizado da proposta continua usando o renderer Markdown seguro.
- Moderacao exibe resumo por linhas adicionadas/removidas quando a pagina da proposta esta aberta.
- Comparacao de revisoes tambem mostra digest de linhas alem das duas versoes renderizadas.
- Preview da requisicao mostra aviso claro quando a versao atual da pagina diverge da `baseVersion` da proposta.
- Aprovacao/reprovacao segue protegida pelo `baseVersion` na API.

## Residual
- Diff visual ainda e simples, por linhas normalizadas; nao destaca mudancas dentro da mesma linha.
- Conflito completo ainda nao mostra tres paineis persistidos quando a pagina base nao esta aberta.
- Destaque especifico de imagens adicionadas/removidas fica dependente de `AT-032`.

## Riscos
- Diff visual errado induzir aprovacao ruim.
- Imagens em propostas aprovadas precisam continuar disponiveis.
- Comparacao rica pode ficar pesada se tentar ser perfeita no MVP.
