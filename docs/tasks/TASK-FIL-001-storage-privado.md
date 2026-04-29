# TASK-FIL-001 - Storage privado de documentos

## Metadata
- status: proposed
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
