# TASK-AT-008 - Dashboard action center

## Metadata
- status: completed
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-008-dashboard-action-center.md

## Modo
- mode: implementation

## Objetivo unico
Transformar o dashboard em uma central de acoes do dia, incluindo pendencias da wiki alem das filas operacionais ja existentes.

## Contexto minimo
O dashboard ja mostra metricas e filas de licencas, documentos e notificacoes. Depois da wiki, a fila de revisoes admin tambem precisa aparecer como acao operacional.

## Inputs
- `services/api/src/core/dashboard/dashboard.service.ts`
- `services/api/src/core/dashboard/dashboard.service.test.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`

## Dependencias
- satisfeitas: dashboard operacional e wiki edit requests
- em aberto: deep links com filtros por entidade

## Alvos explicitos
1. Metrica `wiki.pendingRequests` no dashboard.
2. Fila `pendingWikiRequests` com pagina, autor e versao base.
3. Central de acoes no topo do dashboard com atalhos para telas certas.
4. Teste de dashboard cobrindo metricas/filas wiki.

## Fora de escopo
- Novo workflow de regularizacao.
- Filtros persistentes entre telas.
- Notificacoes push.

## Checklist
1. Agregar requisicoes wiki pendentes no service. Status: completed.
2. Renderizar metricas e fila no dashboard web. Status: completed.
3. Cobrir agregacao em teste. Status: completed.

## Acceptance Criteria
1. Admin ve total de revisoes wiki pendentes no dashboard.
2. RT/Supervisor ve apenas as proprias requisicoes pendentes quando aplicavel.
3. A central de acoes leva para licencas, documentos, configuracoes ou wiki.

## Validacao
- comandos/checks: `npm run check`, `npm run build --workspace @alwaystrack/web`
- revisao manual: carregar dashboard com seed e abrir atalho de wiki

## Riscos
- Atalhos ainda abrem a tela, nao um filtro especifico por linha.
