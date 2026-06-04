# EXEC-AT-015 - Wiki image attachments MVP

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-015-wiki-image-attachments.md

## Objetivo
Permitir que a Wiki use imagens privadas sem depender de links externos e sem expor arquivos entre organizacoes.

## Entregue
- `AT-032` concluida como MVP.
- `WikiAttachment` criado no Prisma com organizacao, autor, arquivo privado, pagina/requisicao opcional e metadata.
- Upload autenticado de PNG/JPG/WebP usando o provider de storage existente.
- Endpoint autenticado para servir imagem com escopo por organizacao.
- Editor Markdown ganhou botao `Imagem`, envia arquivo e insere Markdown automaticamente.
- Preview e pagina publicada usam o renderer Markdown existente para mostrar a imagem.

## Validacao
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts` passou, 15 testes.
- `npm run typecheck --workspace @alwaystrack/api` passou.
- `npm run typecheck --workspace @alwaystrack/web` passou.

## Residual
- Politica automatica de anexos orfaos.
- Galeria/listagem de anexos por pagina.
- Compressao/redimensionamento automatico.
- `AT-033`: diff/conflito mais granular para admin.
