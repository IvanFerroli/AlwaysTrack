# TASK-AT-069 - Central Operacional Hoje

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-069-operational-today-center.md

## Fase
- fase: A - Impacto para apresentacao
- prioridade: 1
- dependencias: dashboard, notas, ranking, campanhas, Wiki, FAQ, notificacoes e auditoria existentes.

## Objetivo unico
Criar uma home executiva "Hoje" que mostre o estado atual da operacao e leve cada indicador para uma acao real com filtro aplicado.

## Contexto
O AlwaysTrack precisa abrir como painel de comando, nao como mosaico decorativo. A central deve provar as duas teses do produto: venda com nota vira ranking auditavel; duvida operacional vira conhecimento governado.

## Escopo funcional
1. Cards de notas pendentes, aprovadas hoje, rejeitadas hoje, duplicidades e falhas de extracao/reprocessamento.
2. Ranking parcial do periodo padrao com top vendedores e variacao/ultima atualizacao quando disponivel.
3. Campanhas ativas e proximas de terminar.
4. Wiki aguardando revisao, FAQ sem resposta e notificacoes/alertas importantes.
5. Cada card deve navegar para a tela correta com filtros aplicados ou contexto preservado.

## Arquivos candidatos
- `apps/web/src/views/dashboard.tsx` ou nova `apps/web/src/views/today.tsx`
- `apps/web/src/main.tsx`
- `apps/api/src/**/sales*`
- `apps/api/src/**/wiki*`
- `apps/api/src/**/faq*`
- `apps/api/src/**/notifications*`
- `packages/shared/src/**`

## Plano de execucao
1. Definir contrato agregado `/v1/operations/today` ou compor com endpoints existentes se suficiente.
2. Implementar agregados backend com queries simples e limitadas.
3. Criar UI responsiva com cards densos, listas curtas e CTAs reais.
4. Conectar cliques a filtros/telas existentes.
5. Adicionar estados vazios uteis para demo.
6. Cobrir com teste de API para agregados e smoke de navegacao basica.

## Acceptance Criteria
1. A tela inicial exibe estado operacional do dia/periodo padrao sem depender de dados manuais.
2. Nenhum card e apenas decorativo: todos levam a uma tela/acao com filtro aplicado.
3. Admin/Supervisor ve resumo amplo; Vendas/SAC respeitam escopo de role.
4. O dashboard antigo continua acessivel ou e incorporado sem perda de funcionalidades.
5. Typecheck/build passam e ha pelo menos teste backend do agregado principal.

## Impacto na apresentacao
Abre a demo com uma narrativa forte: "aqui esta tudo que precisa de decisao hoje".

## Riscos
- Query agregada pesada se tentar calcular tudo em tempo real sem limites.
- Excesso visual se a tela virar outro dashboard generico.

