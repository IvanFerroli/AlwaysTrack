# EXEC-AT-017 - Sales document review editor

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-017-sales-document-review-editor.md

## Objetivo
Permitir que perfis superiores revisem e corrijam dados extraidos de DANFE antes de aprovar a nota para ranking, campanhas e extratos.

## Entregue
- `AT-018B` concluida como fatia visual.
- Tela de Notas ganhou editor manual para documentos `PENDING_REVIEW`.
- Campos editaveis: chave, NF, serie, emissao, emitente, comprador, total e motivo de reprovacao.
- Itens comerciais podem ser editados, adicionados e removidos antes da aprovacao.
- Aprovacao/reprovacao usa o rascunho editado e preserva o endpoint transacional existente.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web` passou.
- `npm run build --workspace @alwaystrack/web` passou.

## Residual
- Fila dedicada de revisao com filtros por status/vendedor/grupo.
- Mascara monetaria em reais; hoje o editor usa centavos para manter o contrato direto com a API.
- Edicao inline com recalculo automatico de total por quantidade e valor unitario.
