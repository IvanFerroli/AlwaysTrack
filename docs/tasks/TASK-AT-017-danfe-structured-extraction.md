# TASK-AT-017 - DANFE structured extraction

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-017-danfe-structured-extraction.md

## Objetivo
Extrair dados estruturados de DANFE/nota fiscal enviada pelo vendedor com caminho deterministico barato primeiro e provider de IA documental apenas como fallback.

## Entregue
- Parser deterministico inicial para DANFE PDF textual (`TASK-AT-028`).
- Parser deterministico para XML NF-e (`deterministic-nfe-xml`, `xml-v1`).
- Upload agora tenta extracao e persistencia imediata no Prisma antes de depender de IA.
- Provider de IA reaproveitado para schema comercial de DANFE.
- Suporte a OpenAI, Gemini e fake/local sem expor chaves.
- Endpoint `POST /v1/sales/documents/:documentId/analyze`.
- Persistencia em `SalesDocumentExtraction`.
- Atualizacao de campos fiscais em `SalesDocument`.
- Criacao/substituicao de `SalesItem` extraidos.
- Deteccao inicial de chave de acesso duplicada.
- Botao `Extrair` na tela de Notas restrito a notas ainda nao estruturadas.
- Secao colapsavel de dados extraidos direto da base operacional.

## Aceite
- PDF textual de DANFE e XML NF-e podem ser enviados e estruturados sem chamada externa.
- PDF/imagem sem texto ainda pode seguir para fallback de extracao.
- Resultado altera nota para `PENDING_REVIEW` quando extraido.
- Falha externa nao quebra upload; nota volta ao status anterior.
- Auditoria registra sucesso, duplicidade ou falha.

## Residual
- Acuracia de PDF escaneado/imagem ainda depende do provider ou revisao manual.
- Ainda nao ha editor granular de campos/itens; revisao MVP aprova/reprova com os dados atuais.
- Nao ha suporte a ZIP/lote de XMLs.
