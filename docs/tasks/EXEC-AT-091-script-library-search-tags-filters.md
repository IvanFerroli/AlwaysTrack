# EXEC-AT-091 - Scriptoteca: busca, tags e filtros

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-091-script-library-search-tags-filters.md

## Entrega
Busca e filtros combinaveis na API e UI da Scriptoteca.

## Detalhes
1. Filtro por texto, categoria, canal, status e tag.
2. Scripts obsoletos ficam fora do fluxo principal por padrao.
3. Gestores podem incluir obsoletos quando necessario.
4. Busca global passa a retornar scripts validados como grupo `Scriptoteca`.
5. Teste de busca global atualizado para cobrir scripts.

## Validacao
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts search.service.test.ts`
