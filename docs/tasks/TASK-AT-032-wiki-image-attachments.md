# TASK-AT-032 - Wiki image attachments

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-05-30
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

## Riscos
- Arquivos orfaos.
- Vazamento cross-org por URL previsivel.
- Imagem grande afetar performance.
- Requisicao rejeitada deixar anexo sem dono claro.
