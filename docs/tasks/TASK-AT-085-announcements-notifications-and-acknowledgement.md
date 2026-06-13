# TASK-AT-085 - Avisos: notificacoes e ciencia

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-085-announcements-notifications-and-acknowledgement.md
- execution: docs/tasks/EXEC-AT-085-announcements-notifications-and-acknowledgement.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.3
- dependencias: `TASK-AT-083`, notificacoes in-app existentes.

## Objetivo unico
Fazer avisos publicados chegarem aos usuarios certos e permitir saber quem viu/cientificou.

## Escopo funcional
1. Gerar notificacoes in-app ao publicar aviso.
2. Link profundo da notificacao para o aviso.
3. Evitar duplicidade de notificacoes em re-publicacoes.
4. Registro de leitura/ciencia por usuario.
5. Badge ou contador de avisos nao lidos.
6. Opcional: acao "Marcar como ciente" para avisos criticos.

## Acceptance Criteria
1. Publicar aviso gera notificacao para publico alvo.
2. Usuario consegue abrir aviso a partir da notificacao.
3. Avisos criticos exigem ciencia quando configurado.
4. Admin/Gestor consegue ver resumo de alcance/ciencia.

## Riscos
- Excesso de notificacao virar ruido; agrupar ou deduplicar desde a primeira versao.
