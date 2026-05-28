# TASK-UX-004 - Microcopy, ajuda contextual e acentuacao

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-004-microcopy-ajuda-contextual-acentuacao.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Revisar textos, labels, acentuacao e ajudas contextuais para reduzir duvida operacional em formularios, filtros e botoes.

## Contexto minimo
Os prints mostram labels tecnicos como `Unidade ID`, `RT ID`, `Tipo ID`, `ACAO`, status em ingles e textos sem acento. A UI precisa ficar mais natural para operadores brasileiros.

## Inputs
- prints enviados pelo usuario em 2026-04-30
- telas existentes de dashboard, documentos, relatorios, auditoria e login

## Dependencias
- satisfeitas: `TASK-UX-002`, `TASK-REL-001`
- em aberto: n/a

## Alvos explicitos
1. labels, placeholders e titulos em `apps/web/src/main.tsx`
2. estilos de tooltip/help text em `apps/web/src/styles.css`
3. componentes compartilhados em `apps/web/src/components/operational.tsx`

## Fora de escopo
- internacionalizacao completa
- mudar contratos da API
- criar tutorial longo

## Checklist
1. Corrigir acentuacao e capitalizacao em navegacao, tabelas, filtros, botoes e estados.
2. Trocar labels tecnicos por termos operacionais quando possivel.
3. Adicionar icones/botoes de informacao em campos com conceito menos obvio.
4. Adicionar textos curtos de ajuda em filtros sensiveis sem poluir a tela.
5. Padronizar status visiveis para portugues quando exibidos ao usuario.

## Acceptance Criteria
1. Telas principais nao exibem textos sem acento quando houver equivalente em portugues.
2. Filtros por IDs deixam claro quando o usuario deve informar identificador tecnico.
3. Campos e botoes criticos possuem ajuda contextual curta e acessivel.
4. Nenhum tooltip/help text cobre conteudo importante ou quebra layout mobile.

## Definition of Done
1. Revisao textual aplicada nas telas principais.
2. Ajuda contextual cobre pelo menos filtros de relatorios, documentos, auditoria e configuracoes.
3. Estados e badges continuam visualmente consistentes.

## Validacao
- comandos/checks: `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: login, dashboard, documentos, relatorios, auditoria, configuracoes

## Evidencia esperada
- screenshots ou lista de telas revisadas
- exemplos de labels antes/depois
- resultado dos comandos de validacao

## Riscos
- textos de ajuda virarem manual embutido e deixarem a tela pesada
- traducao parcial criar inconsistencia

## Execucao
- Labels e mensagens principais revisados para portugues operacional com acentuacao.
- Filtros tecnicos ganharam ajuda contextual curta.
- Status visiveis e textos de erro/vazio foram polidos.

## Evidencias
- `apps/web/src/main.tsx`
- `apps/web/src/components/operational.tsx`
- `apps/web/src/styles.css`
- `npm run build --workspace @alwaystrack/web`
- `npm run check`

## Blockers possiveis
- falta de nomes amigaveis para filtros que hoje so aceitam ID

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
