# EXEC-AT-129 - Formatacao por canal da Scriptoteca

## Metadata
- status: completed
- task: TASK-AT-129
- date: 2026-06-18

## Entrega
1. A copia do script usa o mesmo texto mostrado no preview operacional.
2. WhatsApp, Instagram e Telefone recebem texto plano derivado do Markdown.
3. O painel mostra alertas quando Markdown foi removido, quando ha placeholders em e-mail ou texto longo em canais de conversa.
4. Scripts existentes seguem funcionando sem migracao de dados.

## Validacao esperada
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Variantes persistidas por canal nao foram adicionadas neste MVP; a solucao atual e uma transformacao leve e reversivel na borda da copia.
