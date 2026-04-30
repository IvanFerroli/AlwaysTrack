# TASK-UX-006 - Polimento de labels, formularios e tabelas

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-006-polimento-labels-formularios-tabelas.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer

## Objetivo unico
Corrigir inconsistencias visuais e textuais de formularios e tabelas para deixar a V1 mais polida e legivel.

## Contexto minimo
Os prints e a descricao de UX indicam pontos de acabamento: acentuacao, labels, formularios densos, tabelas e nomenclaturas ainda muito tecnicas.

## Inputs
- prints avaliados pelo solicitante
- descricao do usuario: acentuacao/labels, polimento visual de formularios e tabelas
- `TASK-UX-002`

## Dependencias
- satisfeitas: `TASK-UX-002`
- em aberto: glossario final de termos do produto, se houver

## Alvos explicitos
1. labels de navegacao, filtros, formularios e botoes
2. headers de tabelas
3. placeholders e mensagens vazias/erro de UI
4. espacamento e alinhamento de formularios e tabelas

## Fora de escopo
- refatorar componentes de UI em larga escala
- alterar contratos de API ou nomes internos de enum
- redesenhar dashboard
- trocar biblioteca visual

## Checklist
1. Auditar strings visiveis com falta de acento ou termo tecnico desnecessario.
2. Padronizar labels e placeholders em portugues operacional.
3. Ajustar espacamento, alinhamento e largura minima de campos/tabelas onde houver quebra visual.
4. Revisar estados vazio/erro para linguagem consistente.

## Acceptance Criteria
1. Labels visiveis ao usuario usam portugues claro e acentuado quando aplicavel.
2. Formularios mantem alinhamento consistente em desktop e mobile.
3. Tabelas continuam escaneaveis com muitos registros e sem quebra incoerente de coluna.
4. Placeholders nao substituem labels e nao exigem conhecimento de IDs quando houver alternativa melhor.

## Definition of Done
1. Strings visiveis revisadas nas telas priorizadas.
2. Formulario e tabela padrao seguem o mesmo ritmo visual.
3. Nao ha mudanca funcional alem de copy e apresentacao.

## Validacao
- comandos/checks: `npm run build --workspace @sylembra/web`, `npm run check`
- revisao manual: profissionais, licencas, documentos, relatorios, auditoria e configuracoes em desktop/mobile

## Evidencia esperada
- lista das telas revisadas
- screenshots antes/depois dos pontos mais visiveis

## Riscos
- corrigir labels visiveis e quebrar testes que dependem de texto
- trocar termo tecnico que usuarios internos ja reconhecem

## Execucao
- Formularios, filtros, tabelas e botoes principais receberam labels mais claros.
- Espacamento de header, tooltips, tabelas e pagina de ajuda foi ajustado.
- Textos tecnicos foram mantidos apenas quando o campo ainda exige ID/status tecnico.

## Evidencias
- `apps/web/src/main.tsx`
- `apps/web/src/components/operational.tsx`
- `apps/web/src/styles.css`
- `npm run build --workspace @sylembra/web`
- `npm run check`

## Blockers possiveis
- ausencia de glossario aprovado para termos de dominio
- telas ainda em placeholder sem conteudo final

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
