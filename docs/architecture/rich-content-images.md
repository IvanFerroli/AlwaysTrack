# Rich content images

## Status
- status: active-mvp
- owner: product-builder
- last-updated: 2026-06-18

## Decisao
O AlwaysTrack usa um unico fluxo de upload de imagem para conteudo operacional rico. A mecanica atual reaproveita o upload privado da Wiki e insere Markdown no conteudo:

```markdown
![nome-do-arquivo](/v1/wiki/attachments/{attachmentId}/file)
```

Esse caminho atende Wiki, FAQ, Avisos e Scriptoteca no MVP sem duplicar storage, validacao de MIME/magic bytes, permissao de organizacao ou download autenticado.

## Onde esta aplicado
- Wiki: criacao/edicao de pagina.
- FAQ: contexto da pergunta e respostas.
- Avisos: conteudo do comunicado.
- Scriptoteca: corpo do script e sugestoes de script.

## Armazenamento
- Backend: `WikiAttachment` e storage privado atual.
- Download: endpoint autenticado `/v1/wiki/attachments/:attachmentId/file`.
- Validacao: somente `image/png`, `image/jpeg` e `image/webp`, com verificacao por bytes.
- Escopo: organizacao do usuario autenticado.

## Limites do MVP
- O anexo ainda usa o nome tecnico `wiki-attachments`, mesmo quando vem de FAQ, Avisos ou Scriptoteca.
- Nao existe ordenacao/remocao visual dedicada; remover a linha Markdown remove a imagem do conteudo, mas nao apaga o arquivo do storage.
- Auditoria dedicada de remocao por dominio fica para um slice futuro se o volume justificar.

## Risco operacional
Nao colocar dados pessoais ou comerciais sensiveis em imagens sem necessidade. Prints devem ser tratados como conteudo operacional interno e seguem o plano de backup/retencao do storage privado.
