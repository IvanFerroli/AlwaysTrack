# TASK-AT-135 - Governanca e versionamento de Fluxos de Atendimento

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-135-service-flow-governance-and-versioning.md

## Objetivo unico
Adicionar ciclo de vida maduro aos fluxos: rascunho, revisao, publicacao, arquivamento, versoes e comentarios de aprovacao/rejeicao.

## Escopo
1. Criar revisoes de fluxo.
2. Comparar versoes.
3. Exigir comentario em aprovacao/rejeicao.
4. Notificar SAC quando fluxo relevante mudar.
5. Painel de fluxos vencidos/sem revisao.

## Acceptance Criteria
1. Fluxo publicado tem autor, revisor e versao.
2. Mudancas relevantes ficam auditaveis.
3. Atendente sempre ve versao publicada.

## Resultado
- Entregue em `EXEC-AT-135`.
- Fluxos ganharam versao, comentario de revisao, vencimento de revisao, revisor e historico de revisoes com snapshot JSON.
- Publicar/arquivar exige comentario, incrementa versao, registra auditoria e, na publicacao, notifica usuarios comerciais.

## Residual
- Comparacao visual entre snapshots fica para uma proxima fatia, se for necessaria para revisao editorial.
