# TASK-AT-032 - Wiki image attachments

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-032-wiki-image-attachments.md

## Objetivo
Permitir imagens na Wiki sem vazar arquivos entre organizacoes e sem depender de links externos.

## Escopo
- Upload autenticado de PNG, JPG e WebP para paginas/requisicoes da Wiki.
- Armazenamento privado usando o provider de storage existente.
- Insercao no editor como imagem Markdown.
- Endpoint de leitura com escopo por organizacao.
- Politica para anexos de requisicoes rejeitadas ou rascunhos abandonados.

## Aceite
- Autor insere imagem no conteudo da Wiki.
- Imagem aparece no preview e na pagina publicada.
- Upload valida MIME e tamanho.
- Usuario de outra organizacao nao acessa o arquivo.
- Imagem usada em revisao publicada continua disponivel no historico.

## Entregue no MVP
- Novo modelo `WikiAttachment` com organizacao, autor, arquivo privado, pagina/requisicao opcional e metadata do arquivo.
- Upload autenticado de PNG/JPG/WebP usando o storage privado existente.
- Endpoint autenticado de leitura `/v1/wiki/attachments/:attachmentId/file` com escopo por organizacao.
- Editor Markdown ganhou botao `Imagem`, faz upload e insere `![arquivo](url)` automaticamente.
- Testes de service cobrem upload, storage/auditoria e leitura escopada por organizacao.

## Residual
- Politica fina de anexos orfaos ainda nao foi automatizada; anexos enviados antes de publicar/sugerir ficam presos a organizacao e autor.
- Ainda nao ha galeria/listagem de anexos por pagina.
- Ainda nao ha compressao ou redimensionamento automatico de imagem.

## Riscos
- Arquivos orfaos.
- Vazamento cross-org por URL previsivel.
- Imagem grande afetar performance.
- Requisicao rejeitada deixar anexo sem dono claro.
