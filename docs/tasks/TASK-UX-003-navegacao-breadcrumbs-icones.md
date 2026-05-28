# TASK-UX-003 - Header persistente, navegacao e breadcrumbs

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-003-navegacao-breadcrumbs-icones.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Garantir header com navbar persistente em todas as paginas autenticadas e melhorar orientacao com breadcrumbs e icones.

## Contexto minimo
Os prints atuais mostram uma UI funcional, mas ainda com pouca orientacao de localizacao, poucas pistas visuais e necessidade explicita de header/navbar persistente em todas as paginas.

## Inputs
- prints enviados pelo usuario em 2026-04-30
- `TASK-UX-001`
- `TASK-UX-002`

## Dependencias
- satisfeitas: `TASK-UX-001`, `TASK-UX-002`, `TASK-REL-001`
- em aberto: n/a

## Alvos explicitos
1. `apps/web/src/main.tsx`
2. `apps/web/src/styles.css`
3. biblioteca leve de icones se necessario

## Fora de escopo
- redesenhar identidade visual
- trocar framework de UI
- alterar API/backend

## Checklist
1. Adicionar header persistente com navbar/atalhos principais em todas as paginas autenticadas.
2. Adicionar breadcrumbs nas telas autenticadas principais.
3. Adicionar icones consistentes na navegacao lateral, header e acoes recorrentes.
4. Melhorar indicacao de pagina ativa, hierarquia e retorno ao dashboard.
5. Garantir responsividade sem sobreposicao em desktop e mobile.

## Acceptance Criteria
1. Header/navbar persistente aparece nas paginas autenticadas sem cobrir conteudo.
2. Usuario consegue identificar onde esta e voltar para secoes superiores sem depender apenas do menu lateral.
3. Itens principais do menu possuem icones reconheciveis e alinhados.
4. Botoes de acao recorrentes usam iconografia consistente sem perder label textual quando necessario.
5. Build web continua passando.

## Definition of Done
1. Navegacao autenticada revisada em todas as secoes principais.
2. Header/navbar persistente implementado em dashboard, profissionais, licencas, documentos, relatorios, auditoria, configuracoes e ajuda.
3. Breadcrumbs aparecem em dashboard, profissionais, licencas, documentos, relatorios, auditoria, configuracoes e `Como usar`.
4. Screenshot desktop e mobile anexado ou descrito na evidencia.

## Validacao
- comandos/checks: `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: desktop e mobile nas telas principais

## Evidencia esperada
- screenshots antes/depois
- lista dos icones/biblioteca usados
- resultado dos comandos de validacao

## Riscos
- excesso de icones deixar a tela mais ruidosa
- breadcrumbs duplicarem informacao sem utilidade

## Execucao
- Header autenticado persistente com breadcrumbs e atalhos principais.
- Navegacao lateral e header ganharam iconografia local leve.
- Pagina ativa, retorno ao dashboard e hierarquia visual foram reforcados.

## Evidencias
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `npm run build --workspace @alwaystrack/web`
- `npm run check`

## Blockers possiveis
- conflito visual com estilos existentes
- biblioteca de icones aumentar bundle sem necessidade

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
