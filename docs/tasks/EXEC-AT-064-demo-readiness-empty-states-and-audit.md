# EXEC-AT-064 - Demo readiness, empty states and audit search

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-065-demo-readiness-empty-states-and-audit.md

## Objetivo
Preparar o AlwaysTrack para apresentacao como produto acabado, com dados demo coerentes, estados vazios uteis e auditoria consultavel.

## Entregas
1. Criado roteiro de demo em `docs/demo/always-track-demo-checklist.md`.
2. Seed comercial reforcado com organizacao configurada, tres vendedores, campanha demo atual, notas aprovadas, nota pendente, snapshot de ranking, Wiki, FAQ resolvida/promovida e notificacoes in-app.
3. Seed continua idempotente por chaves estaveis para evitar duplicacao em execucoes repetidas.
4. Estados vazios principais agora orientam proxima acao em Dashboard, Notas, Ranking, Campanhas, Extratos, Wiki, FAQ e Usuarios/Times.
5. Auditoria passou a buscar acao por trecho e a incluir o dia inteiro quando o filtro `Fim` recebe uma data simples.
6. UI de auditoria ganhou opcoes comerciais comuns para acao e entidades de vendas/Wiki/FAQ/notificacoes.

## Decisoes
- A validacao do seed foi feita em banco SQLite temporario pelo script oficial de migrations para nao resetar o `dev.db` local.
- A task de visual pixel-perfect segue bloqueada em `TASK-AT-066` ate o usuario mandar prints.
- Dados demo seguem ficticios e pequenos para nao mascarar fluxos reais.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- audit.service.test.ts`
- `npm run db:test:migrations`

## Riscos residuais
- O `dev.db` local pode estar com drift historico; nesse caso, rode migrations/reset conscientemente antes de usar `npm run prisma:seed` direto nele.
- A demo mostra dados comerciais suficientes, mas ajustes visuais finais dependem dos prints da `TASK-AT-066`.
