# TASK-UX-005 - Pagina Como usar e ajuda operacional

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-005-ajuda-operacional-como-usar.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Adicionar uma pagina ou secao `Como usar` com ajuda operacional curta para orientar admin, RT e supervisor nos fluxos mais importantes da V1.

## Contexto minimo
A V1 esta demonstravel, mas operadores novos ainda precisam encontrar uma pagina/secao `Como usar` para entender dashboard, documentos, relatorios, notificacoes e auditoria sem depender de explicacao externa.

## Inputs
- `docs/operations/v1-demo-acceptance-2026-04-30.md`
- fluxo atual do app autenticado
- prints enviados pelo usuario em 2026-04-30

## Dependencias
- satisfeitas: `TASK-REL-001`, `TASK-UX-003`, `TASK-UX-004`
- em aberto: n/a

## Alvos explicitos
1. nova pagina/secao `Como usar` no app autenticado
2. item de navegacao `Como usar` no header/navbar persistente
3. conteudo curto baseado no roteiro de demo e nos perfis de usuario

## Fora de escopo
- base de conhecimento completa
- FAQ publica para profissional
- videos, tour guiado ou onboarding complexo

## Checklist
1. Criar entrada de navegacao `Como usar` no header/navbar persistente e, se mantido, no menu lateral.
2. Organizar conteudo por perfil: Admin, RT e Supervisor.
3. Explicar os fluxos essenciais: dashboard, documentos, relatorios, notificacoes, auditoria e upload publico.
4. Incluir alertas curtos sobre Meta real, token de upload e validacao de documentos.
5. Garantir que a pagina nao pareca landing page e seja util durante operacao.

## Acceptance Criteria
1. Usuario autenticado encontra `Como usar` em ate um clique a partir de qualquer pagina autenticada.
2. Conteudo explica o caminho feliz da V1 sem expor segredos ou dados sensiveis.
3. A pagina usa componentes e estilo existentes, sem criar design paralelo.
4. Conteudo cabe bem em desktop e mobile.

## Definition of Done
1. Pagina/secao `Como usar` acessivel no app autenticado.
2. Conteudo cobre os papeis Admin, RT e Supervisor.
3. Nenhum token, secret ou dado real sensivel aparece na pagina.

## Validacao
- comandos/checks: `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: acesso como Admin, RT e Supervisor

## Evidencia esperada
- screenshot da pagina de ajuda
- lista dos fluxos documentados
- resultado dos comandos de validacao

## Riscos
- ajuda ficar generica demais e nao reduzir duvidas reais
- conteudo desatualizar se os fluxos mudarem

## Execucao
- Criada pagina autenticada `Como usar`.
- Conteudo organizado por perfil e por fluxo operacional da V1.
- Entrada adicionada na navegacao persistente.

## Evidencias
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `npm run build --workspace @alwaystrack/web`
- `npm run check`

## Blockers possiveis
- definicao final de termos usados pela operacao

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
