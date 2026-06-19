# TASK-AT-146 - Anexos operacionais: remocao auditavel e entidade generica

## Metadata
- status: completed-mvp-slice
- owner: olympus-orchestrator
- priority: medium
- created: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-146-attachments-removal-and-generic-operational-entity.md

## Objetivo
Completar o slice de anexos/imagens transversais com remocao auditavel, entidade generica de anexo e seed visual consistente para demo.

## Contexto
`TASK-AT-101` entregou slice MVP de imagens/anexos. Falta governanca operacional para apagar/ocultar anexos e reutilizar o mecanismo em Avisos, Wiki, FAQ, Fluxos e Scriptoteca sem duplicacao.

## Plano
1. Mapear entidades que usam conteudo rico.
2. Definir contrato comum de anexo operacional.
3. Implementar remocao/arquivamento auditavel.
4. Garantir permissao por role e organizacao.
5. Adicionar seed demo com imagens leves e nao sensiveis.

## Criterios de Aceite
1. Remover anexo nunca apaga trilha de auditoria.
2. Usuario sem permissao nao consegue acessar anexo de outra organizacao.
3. Conteudo rico continua renderizando sem quebrar quando anexo e arquivado.

## Resultado
- Entregue slice auditavel para anexos de Wiki:
  - `WikiAttachment` ganhou `archivedAt` e `archivedById`.
  - `DELETE /v1/wiki/attachments/:attachmentId` arquiva o anexo em vez de apagar fisicamente.
  - Download de anexo arquivado retorna `NOT_FOUND`.
  - Auditoria registra `wiki.attachment.archive` com `storagePreserved: true`.
- A migration `20260619123000_wiki_attachment_archive` preserva compatibilidade local.

## Fora do MVP
- Entidade generica unica para anexos de Avisos, FAQ, Fluxos e Scriptoteca continua como evolucao futura se a duplicacao virar dor real.
- Seeds visuais adicionais ficam cobertos pela frente de polimento/demo, nao por esta task.
