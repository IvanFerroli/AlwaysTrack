# EXEC-AT-072 - Modo demo guiado

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- source-task: `TASK-AT-072-guided-demo-mode.md`

## Resumo
Criado modo demo guiado para apresentacao interna, com reset local seguro, faixa visual opcional no app e roteiro atualizado cobrindo Central, Notas, Timeline, Ranking explicavel, FAQ/Wiki e Notificacoes.

## Implementacao
1. Adicionado script `scripts/reset-local-demo.js`.
2. Adicionado comando `npm run demo:reset:local`.
3. Script recusa `NODE_ENV=production` e `DATABASE_URL` nao-local.
4. Adicionada env `VITE_DEMO_MODE` para exibir faixa visual de roteiro no web.
5. Adicionado banner com atalhos para Central, Notas, Ranking e FAQ.
6. Atualizado checklist de demo e criado roteiro guiado em `docs/demo/guided-demo-script.md`.
7. Expandido backlog de Avisos em tasks `TASK-AT-083` a `TASK-AT-087`.

## Arquivos principais
- `scripts/reset-local-demo.js`
- `package.json`
- `.env.example`
- `apps/web/src/api.ts`
- `apps/web/src/vite-env.d.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `docs/demo/always-track-demo-checklist.md`
- `docs/demo/guided-demo-script.md`
- `docs/tasks/TASK-AT-083-announcements-data-model-and-permissions.md`
- `docs/tasks/TASK-AT-084-announcements-rich-editor-and-reader.md`
- `docs/tasks/TASK-AT-085-announcements-notifications-and-acknowledgement.md`
- `docs/tasks/TASK-AT-086-announcements-operational-today-integration.md`
- `docs/tasks/TASK-AT-087-announcements-links-search-and-governance.md`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `NODE_ENV=production node scripts/reset-local-demo.js` falhou como esperado.
- `DATABASE_URL='postgresql://user:pass@example.com/db' node scripts/reset-local-demo.js` falhou como esperado.

## Riscos e proximos passos
- `npm run demo:reset:local` e destrutivo para banco SQLite local; usar apenas em demo/dev.
- A faixa `VITE_DEMO_MODE=true` e apenas visual e nao altera permissoes nem dados.
- Avisos foram detalhados no backlog, mas ainda nao implementados.

