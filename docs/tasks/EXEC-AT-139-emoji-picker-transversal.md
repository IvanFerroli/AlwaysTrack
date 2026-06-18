# EXEC-AT-139 - Emoji picker transversal

## Metadata
- status: completed
- task: TASK-AT-139
- date: 2026-06-18

## Entrega
1. `MarkdownEditor` recebeu um picker simples com emojis operacionais comuns.
2. A insercao acontece no cursor e preserva espacos ao redor quando necessario.
3. Como o editor e compartilhado, o recurso fica disponivel em Wiki, FAQ, Avisos, Scriptoteca e Fluxos.

## Validacao esperada
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- A lista e propositalmente curta. Pode ser expandida depois com busca/categorias se virar dor real.
