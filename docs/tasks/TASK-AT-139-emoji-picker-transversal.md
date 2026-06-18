# TASK-AT-139 - Emoji picker transversal em editores ricos

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-139-emoji-picker-transversal.md

## Modo
- mode: implementation

## Objetivo unico
Adicionar um picker simples de emojis aos editores ricos compartilhados, para padronizar comunicados, wikis, FAQs, scripts e fluxos sem depender de copiar emoji de fora.

## Contexto minimo
O AlwaysTrack usa `MarkdownEditor` como base transversal para conteudo operacional. Colocar o picker nesse componente entrega o ganho em varios modulos de uma vez.

## Inputs
- Pedido do usuario: "emoji picker all across".
- Componentes atuais baseados em `MarkdownEditor`.

## Dependencias
- satisfeitas: editor Markdown compartilhado ja existe.
- em aberto: n/a.

## Alvos explicitos
1. `apps/web/src/components/markdown-editor.tsx`
2. `apps/web/src/styles.css`
3. Areas que usam `MarkdownEditor`: Wiki, FAQ, Avisos, Scriptoteca e Fluxos.

## Fora de escopo
- Biblioteca externa de emoji.
- Busca por nome de emoji.
- Emoji picker nativo por categoria extensa.

## Checklist
1. Adicionar botao de emoji ao toolbar do editor.
2. Inserir emoji no cursor preservando espacos.
3. Fechar picker apos selecao.
4. Manter preview Markdown funcionando.

## Acceptance Criteria
1. Usuario consegue inserir emoji em qualquer editor que usa `MarkdownEditor`.
2. Insercao respeita cursor/selecionado sem apagar conteudo fora da selecao.
3. Picker nao quebra layout do toolbar.
4. Nao ha dependencia nova.

## Definition of Done
1. Implementacao frontend concluida.
2. Typecheck web aprovado.
3. Roadmap atualizado.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`
- revisao manual: abrir um editor rico e inserir emojis no texto.

## Evidencia esperada
- Botao `Emoji` no toolbar do editor.
- Emoji inserido no textarea e refletido no preview.

## Riscos
- Lista curta pode nao cobrir todos os tons de comunicacao. Ampliar depois se necessario.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
