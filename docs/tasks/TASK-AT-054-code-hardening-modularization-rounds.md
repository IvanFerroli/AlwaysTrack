# TASK-AT-054 - Code hardening and modularization rounds

## Metadata
- status: completed-partial
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-054-code-hardening-modularization-rounds.md

## Modo
- mode: maintainability-hardening

## Objetivo unico
Executar rodadas controladas de otimizacao de codigo para reduzir risco, acoplamento e tamanho de arquivos, sem refatorar o produto inteiro de uma vez.

## Contexto minimo
`apps/web/src/main.tsx` concentra muita UI e logica. Services backend cresceram com notas, Wiki, FAQ, notificacoes e users. Para manutencao por qualquer dev, precisamos modularizar por dominios, extrair contratos e reforcar invariantes.

## Alvos explicitos
1. Rodada 1: inventario de hotspots por tamanho, complexidade e churn.
2. Rodada 2: extrair frontend por dominios:
   - Notes
   - Ranking
   - Campaigns
   - Statements
   - Wiki
   - FAQ
   - Users/Teams
   - Notifications
3. Rodada 3: extrair hooks e clients API tipados.
4. Rodada 4: reforcar DTOs/schemas compartilhados.
5. Rodada 5: separar services backend em comandos/queries quando fizer sentido.
6. Rodada 6: padronizar erros e responses.
7. Rodada 7: remover legado SyLembra restante ou isolar em modulo legacy.
8. Cada rodada deve ter teste antes/depois e diff pequeno.

## Fora de escopo
- Big bang rewrite.
- Trocar framework.
- Refatorar sem teste de protecao.

## Acceptance Criteria
1. Hotspots documentados com prioridade.
2. Cada rodada reduz complexidade mensuravel ou acoplamento real.
3. `main.tsx` deixa de concentrar toda a UI operacional.
4. Contratos e erros ficam mais previsiveis.
5. `npm run check` passa apos cada rodada.

## Validacao
- `npm run check`
- Playwright smoke quando UI for movida.
- Revisao de diff por modulo.

## Execucao 2026-06-09
- Rodada 1 concluida com inventario de hotspots em `docs/architecture/hardening-hotspots-2026-06-09.md`.
- Rodada 2 iniciada com extracao do cliente API web para `apps/web/src/api.ts`.
- Rodada 2 continuada com extracao da marca/logo para `apps/web/src/components/brand.tsx`.
- Rodada 2 continuada com extracao de tipos/helpers comerciais de campanhas, ranking snapshots e status de jobs para `apps/web/src/sales.ts`.
- Rodada 2 continuada com extracao da view de Campanhas para `apps/web/src/views/campaigns.tsx`.
- Rodada 2 continuada com extracao da view de Ranking para `apps/web/src/views/ranking.tsx` e centralizacao de helpers compartilhados de vendas.
- Rodada 2 continuada com extracao das views de Dashboard e Extratos para `apps/web/src/views/dashboard.tsx` e `apps/web/src/views/statements.tsx`, alem de contratos compartilhados de documentos/extratos em `apps/web/src/sales.ts`.
- Rodada 2 continuada com extracao das views de FAQ e Auditoria para `apps/web/src/views/faq.tsx` e `apps/web/src/views/audit.tsx`.
- Rodada 2 continuada com extracao da view de Usuarios/Times para `apps/web/src/views/users-teams.tsx`.
- Rodada 2 continuada com extracao da view de Notas para `apps/web/src/views/notes.tsx`, mantendo helpers de revisao de DANFE junto do dominio.
- Rodada 2 continuada com extracao da view Como usar para `apps/web/src/views/help.tsx`.
- Rodada 2 continuada com extracao da view Wiki para `apps/web/src/views/wiki.tsx`.
- Rodada 2 continuada com extracao do centro de notificacoes para `apps/web/src/components/notification-center.tsx`.
- As views comerciais ativas deixaram de ficar concentradas em `apps/web/src/main.tsx`; a proxima rodada recomendada e focar hooks/API clients tipados, padronizacao de erros e backend services.

## Riscos
- Refatoracao grande pode introduzir regressao visual.
- Extrair abstracao cedo demais pode piorar manutencao.
