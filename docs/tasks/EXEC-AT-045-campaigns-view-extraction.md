# EXEC-AT-045 - Campaigns view extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-10
- tasks: TASK-AT-054

## Entrega
- `CampaignsView` extraida de `apps/web/src/main.tsx` para `apps/web/src/views/campaigns.tsx`.
- `InfoTip` promovido para `apps/web/src/components/operational.tsx`, permitindo reuso fora do arquivo principal.
- `main.tsx` agora importa a view de Campanhas como modulo de dominio.
- Tamanho de `main.tsx` reduzido de 8105 para 7778 linhas.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- A view extraida ainda usa helpers locais pequenos de formatacao; uma proxima rodada pode consolidar utilitarios comerciais compartilhados.
