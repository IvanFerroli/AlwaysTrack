# TASK-AT-082 - Aba de avisos e comunicados internos

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-082-announcements-center.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13
- dependencias: Wiki rica, notificacoes in-app, Central Operacional Hoje, tags/busca e permissoes comerciais existentes.

## Objetivo unico
Criar uma aba de Avisos para comunicados internos ricos, com editor semelhante ao da Wiki, links entre avisos/Wiki/FAQ e notificacao para usuarios impactados.

## Contexto
O AlwaysTrack ja organiza notas, ranking e conhecimento. Falta um canal formal para comunicados do dia, mudancas operacionais, campanhas, regras temporarias e avisos que todo mundo precisa ver antes de operar.

## Escopo funcional
1. Nova secao "Avisos" no menu e nos atalhos principais, respeitando roles comerciais.
2. CRUD de avisos para Admin/Gestor/Supervisor conforme permissao definida.
3. Conteudo rico reaproveitando o maximo possivel da mecanica da Wiki: titulo, slug, markdown/conteudo estruturado, imagens/anexos se viavel, tags, secoes e preview.
4. Possibilidade de vincular avisos a Wiki, FAQ, outros avisos, campanhas, notas ou links externos.
5. Campo de vigencia/destaque: aviso do dia, prioridade e data de expiracao/arquivamento.
6. Notificacao in-app para publico alvo quando um aviso for publicado.
7. Card/resumo na Central Operacional Hoje mostrando avisos ativos do dia e levando para a aba.
8. Busca/filtros por texto, tag, status, vigencia e prioridade.

## Arquivos candidatos
- `services/api/prisma/schema.prisma`
- `services/api/src/core/announcements/**`
- `services/api/src/core/notifications/**`
- `services/api/src/core/operations/operations.service.ts`
- `apps/web/src/views/announcements.tsx`
- `apps/web/src/views/dashboard.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `packages/shared/src/**`

## Plano de execucao
1. Definir modelo de dados simples para aviso, links e publico alvo.
2. Reaproveitar componentes/contratos da Wiki para editor e renderizacao quando seguro.
3. Criar endpoints de listagem, criacao, edicao, publicacao, arquivamento e leitura.
4. Emitir notificacoes in-app na publicacao, com link profundo para o aviso.
5. Adicionar aba visual e card na Central Operacional Hoje.
6. Cobrir com testes de servico/API para publicacao, escopo e notificacoes.

## Acceptance Criteria
1. Usuario comercial consegue ver avisos ativos e acessar aviso por slug/id.
2. Admin/Gestor/Supervisor autorizado consegue criar/publicar aviso rico.
3. Aviso publicado gera notificacao para o publico alvo.
4. Aviso pode linkar Wiki/FAQ/outro aviso e esses links aparecem no detalhe.
5. Central Operacional Hoje exibe avisos ativos do dia com CTA real.
6. Typecheck/build e testes principais passam.

## Impacto na apresentacao
Completa a narrativa de operacao diaria: alem de pendencias e conhecimento validado, a plataforma comunica prioridades e mudancas do dia para todo mundo.

## Riscos
- Duplicar demais a Wiki em vez de reaproveitar padroes.
- Notificar todo mundo em excesso e gerar ruido.
- Escopo de publico alvo ficar complexo demais para a primeira entrega.

