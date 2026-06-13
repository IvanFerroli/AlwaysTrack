# EXEC-AT-090 - Scriptoteca: navegacao por categoria e preview

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-090-script-library-navigation-preview.md

## Entrega
Nova view `apps/web/src/views/script-library.tsx`, acessivel pelo menu lateral como `Scriptoteca`.

## Detalhes
1. Layout em tres areas: categorias, lista de scripts e painel de preview.
2. Categoria selecionada filtra a lista sem transformar o fluxo em tabela apertada.
3. Preview mostra titulo, canal, status, tags, corpo, placeholders e acoes.
4. Estados de carregamento, erro e lista vazia incluidos.
5. Gestores possuem formulario de categoria/script dentro da tela.

## Validacao
- `npm run build --workspace @alwaystrack/web`
- `npm run typecheck --workspace @alwaystrack/web`
