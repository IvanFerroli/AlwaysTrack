# EXEC-AT-011 - Wiki rich editor planning

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-05-30
- source-of-truth: docs/tasks/EXEC-AT-011-wiki-rich-editor-planning.md

## Pergunta
Qual caminho seguir para dar liberdade de formatacao bonita na Wiki sem quebrar revisao, historico e seguranca?

## Alternativas avaliadas
1. Tiptap/ProseMirror: otimo para editor rico customizado, modular e maduro, mas exige montar toolbar/renderer e cuidar do formato salvo.
2. BlockNote: experiencia pronta estilo Notion, com toolbar e blocos, mas traz UI/dependencias mais opinativas e pode destoar do app.
3. Lexical: muito flexivel e moderno, mas demanda mais implementacao de toolbar, plugins e serializacao.
4. Milkdown/Markdown: Markdown-first sobre ProseMirror, bom para contrato textual, mas adiciona complexidade de ecossistema.
5. Toolbar Markdown propria: menor risco inicial, formato simples, facil de revisar, mas nao e WYSIWYG total.

## Decisao recomendada
Fase 1: Markdown canonico com toolbar propria, preview renderizado e sanitizacao forte.

Fase 2: se o uso pedir uma experiencia mais Notion/Docs, evoluir para Tiptap com schema controlado, reaproveitando o mesmo contrato de conteudo ou migrando de forma explicita.

## Tasks derivadas
1. `TASK-AT-029`: formato rico seguro.
2. `TASK-AT-030`: editor rico/toolbar da Wiki.
3. `TASK-AT-031`: renderer bonito de documento operacional.
4. `TASK-AT-032`: imagens/anexos da Wiki.
5. `TASK-AT-033`: review rico para admin.
6. `TASK-AT-034`: administracao de conteudo.
7. `TASK-AT-035`: descoberta/navegacao.
8. `TASK-AT-036`: qualidade e seguranca da Wiki rica.

## Proxima implementacao recomendada
Executar `TASK-AT-029`, `TASK-AT-030` e `TASK-AT-031` juntas em MVP pequeno: Markdown seguro, toolbar, preview e leitura bonita.

## Validacao futura
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- Smoke manual com admin publicando pagina formatada.
- Smoke manual com vendedor enviando sugestao formatada e admin aprovando.
- Tentativa de conteudo malicioso nao executa script.
