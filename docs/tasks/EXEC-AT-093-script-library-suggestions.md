# EXEC-AT-093 - Scriptoteca: sugestoes e decisao de novos scripts

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-093-script-library-crud-validation-flow.md

## Entrega
Criada esteira simples de sugestoes para a Scriptoteca: SAC/Vendas podem sugerir novos scripts ou alteracoes, e Supervisor/Admin decidem com comentario e rastro.

## Escopo coberto
1. Modelo `OperationalScriptSuggestion` com autor, categoria, script relacionado, tipo, status e decisao.
2. Endpoint para criar sugestao liberado para roles comerciais.
3. Endpoint gerencial para aceitar, rejeitar ou mesclar sugestao.
4. Sugestao aceita cria script em rascunho.
5. Sugestao mesclada atualiza script existente em rascunho.
6. Decisao gera audit log e notificacao in-app para quem sugeriu.
7. UI da Scriptoteca exibe formulario de sugestao e fila de decisao.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts`

## Risco residual
- A decisao usa o texto da sugestao como payload principal; edicao fina antes de aceitar pode ser melhorada em rodada futura.
