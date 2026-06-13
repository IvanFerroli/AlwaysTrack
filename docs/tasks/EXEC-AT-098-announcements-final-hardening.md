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

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- announcements.service.test.ts search.service.test.ts operations.service.test.ts`
- `npm run build --workspace @alwaystrack/web`
- `git diff --check`
