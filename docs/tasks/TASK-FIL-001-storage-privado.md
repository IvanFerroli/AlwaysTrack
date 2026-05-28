# TASK-FIL-001 - Storage privado de documentos

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FIL-001-storage-privado.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Criar adaptador de storage externo privado para PDF/imagem sem salvar arquivo no banco.

## Inputs
- documento central, secao 4.4

## Dependencias
- satisfeitas: `TASK-DAT-001`
- em aberto: provider real de storage

## Alvos explicitos
1. `modules/documents/storage`
2. contrato `StorageProvider`
3. config/env de storage

## Fora de escopo
- tela de upload publica
- preview avancado

## Acceptance Criteria
1. Upload salva fileKey e metadados.
2. Download/visualizacao passa pelo backend ou URL assinada.
3. Provider pode ser trocado sem alterar dominio.

## Validacao
- teste com provider fake/local
- teste de tipo/tamanho

## Riscos
- arquivo ficar publico por engano

## Evidencias de entrega
- Criado contrato `StorageProvider` em `services/api/src/core/documents/storage.ts`.
- Criado provider local privado `LocalStorageProvider`, com raiz configuravel por `STORAGE_LOCAL_DIR`.
- Config adicionada: `STORAGE_LOCAL_DIR` e `DOCUMENT_MAX_BYTES`.
- Upload autenticado em `POST /v1/documents` salva binario no storage e apenas `fileKey`/metadados no banco.
- Download autenticado em `GET /v1/documents/:documentId/download` passa pelo backend.
- Upload valida escopo, tipo permitido (`pdf`, `jpeg`, `png`, `webp`) e tamanho maximo.
- Auditoria `document.upload` registra metadados sem armazenar conteudo.

## Validacao realizada
- `npm run check` passou com 49 testes.
- `npm run setup` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- Smoke local: health, login admin, upload PDF binario, download via backend com `cmp`, auditoria `document.upload`.
