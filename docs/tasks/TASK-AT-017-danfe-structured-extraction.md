# TASK-AT-017 - DANFE structured extraction

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-017-danfe-structured-extraction.md

## Objetivo
Extrair dados estruturados de DANFE/nota fiscal enviada pelo vendedor usando o provider de IA documental configurado.

## Entregue
- Provider de IA reaproveitado para schema comercial de DANFE.
- Suporte a OpenAI, Gemini e fake/local sem expor chaves.
- Endpoint `POST /v1/sales/documents/:documentId/analyze`.
- Persistencia em `SalesDocumentExtraction`.
- Atualizacao de campos fiscais em `SalesDocument`.
- Criacao/substituicao de `SalesItem` extraidos.
- Deteccao inicial de chave de acesso duplicada.
- Botao `Extrair` na tela de Notas.

## Aceite
- PDF/imagem de DANFE pode ser enviado para extracao.
- Resultado altera nota para `PENDING_REVIEW` quando extraido.
- Falha externa nao quebra upload; nota volta ao status anterior.
- Auditoria registra sucesso, duplicidade ou falha.

## Residual
- Acuracia depende do provider e do documento.
- Ainda nao ha editor granular de campos/itens; revisao MVP aprova/reprova com os dados atuais.
