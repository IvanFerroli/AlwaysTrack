# EXEC-AT-085 - Avisos: notificacoes e ciencia

## Metadata
- task: TASK-AT-085
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-12

## Entrega
Publicar aviso emite notificacoes in-app deduplicadas por destinatario, com link profundo para `/avisos/:slug`.

## Ciencia
Avisos podem exigir ciencia; a leitura cria recibo e o botao "Marcar ciencia" atualiza `AnnouncementReadReceipt`.
