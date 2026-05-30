# TASK-AT-025 - Sales DANFE diagnostic logs

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-025-sales-danfe-diagnostic-logs.md

## Objetivo
Adicionar logs estruturados e seguros para diagnosticar o fluxo comercial de DANFE ponta a ponta.

## Entregue
- Logger JSON sanitizado em `services/api/src/core/diagnostics/logger.ts`.
- Log HTTP com `x-request-id`, rota, status, duracao, usuario e role.
- Logs comerciais de upload, extracao, revisao, dashboard, ranking, campanhas e extratos.
- Mascaramento/redacao de tokens, secrets, bearer e chaves Google comuns.
- Logs de erro sem corpo binario, OCR bruto, prompt ou `extractedJson`.
- Correcao do bug de UI que usava `event.currentTarget.reset()` apos `await`.
- Erro de arquivo local ausente agora volta como `STORED_FILE_MISSING`, com mensagem para reenviar a DANFE.
- Investigacao do incidente local: uma linha `UPLOADED` apontava para arquivo ausente no storage; a linha `PENDING_REVIEW` com arquivo existente extraia normalmente, e nova tentativa sobre nota repetida vira `DUPLICATE`.

## Aceite
- Upload e extracao emitem eventos operacionais com `documentId`, `sellerProfileId`, status, provider/model e duracao.
- Leituras de dashboard/ranking/extratos emitem totais resumidos e filtros.
- Falhas de handler emitem evento com requestId e erro sanitizado.
- Logging nao bloqueia fluxo se falhar.

## Residual
- Ainda nao ha painel de observabilidade.
- Logs ficam no stdout/stderr do processo local ou ambiente de execucao.
