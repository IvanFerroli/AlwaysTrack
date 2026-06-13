# EXEC-AT-092 - Scriptoteca: copiar texto e placeholders

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-092-script-library-copy-and-placeholders.md

## Entrega
Copiar texto em um clique com placeholders editaveis antes da copia.

## Detalhes
1. Placeholders sao extraidos automaticamente do corpo do script usando `{nome}`.
2. UI lista os campos encontrados e permite preencher valores temporarios.
3. Copia preserva o texto original salvo no banco.
4. Evento de copia registra usuario, canal e placeholders usados.
5. `usageCount` prepara a base para metricas futuras.

## Validacao
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts search.service.test.ts`
- `npm run build --workspace @alwaystrack/web`
