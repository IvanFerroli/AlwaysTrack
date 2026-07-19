# EXEC-AT-098 - Fechamento da frente de Avisos

## Metadata
- task: TASK-AT-098
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-13

## Entrega
Passada final de hardening dos Avisos para encerrar a frente antes da proxima rodada de backlog.

## Mudancas
- Corrigido filtro combinado de Avisos para preservar janela de vigencia em usuarios nao gestores.
- Busca global de Avisos agora respeita inicio/expiracao.
- Editor de Avisos aceita multiplos links no formato `TIPO|Rotulo|/href`.
- Central Operacional Hoje abre o aviso clicado por slug.
- Gestores recebem recibos de ciencia na listagem para leitura de alcance.
- Teste de operacoes cobre avisos ativos na Central.
- Jornada gerencial agora diferencia `Salvar rascunho` de `Salvar e publicar`, limpa a selecao anterior e recarrega o aviso mutado sem filtros que possam oculta-lo.
- Publicacao pelo editor chama explicitamente `/v1/announcements/:id/publish`, preservando auditoria e notificacao deduplicada.
- Ocorrencias recorrentes agora carregam metadados da serie na leitura, ficam bloqueadas no editor unitario e apontam para a governanca recorrente.
- Publicacao avulsa fora da janela de vigencia falha fechada, sem alterar status nem emitir notificacao prematura.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- announcements.service.test.ts search.service.test.ts operations.service.test.ts`
- `npm run build --workspace @alwaystrack/web`
- `git diff --check`
- `npm exec --workspace @alwaystrack/web vitest run -- test/announcements.test.tsx test/notification-center.test.tsx test/notification-navigation.test.ts test/navigation-roles.test.tsx test/accessibility.test.tsx`
- `npm exec --workspace @alwaystrack/api vitest run -- src/core/announcements/announcements.service.test.ts`
- Resultado da regressao final: 34 testes Web adjacentes e 23 testes de servico de Avisos aprovados, com builds Web/API aprovados.
