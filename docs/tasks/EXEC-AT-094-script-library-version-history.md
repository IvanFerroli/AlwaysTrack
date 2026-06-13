# EXEC-AT-094 - Scriptoteca: historico e versionamento simples

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-094-script-library-version-history.md

## Entrega
Historico operacional dos scripts ficou visivel no detalhe da Scriptoteca, com revisoes recentes, eventos recentes e restauracao segura de revisao antiga apenas para Admin.

## Escopo coberto
1. Listagem da Scriptoteca agora inclui revisoes recentes com autor, versao, status e data.
2. Listagem inclui eventos recentes com acao, usuario e data.
3. UI exibe blocos `Revisões` e `Eventos` no preview do script.
4. Admin pode restaurar uma revisao via endpoint dedicado.
5. Restauracao cria nova revisao, evento `restore` e audit log `script.restore_revision`.
6. SAC e demais roles nao conseguem restaurar revisoes.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts search.service.test.ts`
- `npm run build --workspace @alwaystrack/web`
- `npm run db:test:migrations`

## Risco residual
- O historico mostra snapshots recentes sem diff visual linha a linha. Isso preserva simplicidade e evita escopo de editor complexo.
