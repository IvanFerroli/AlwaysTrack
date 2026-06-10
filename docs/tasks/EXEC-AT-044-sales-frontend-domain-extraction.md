# EXEC-AT-044 - Sales frontend domain extraction

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-10
- tasks: TASK-AT-054

## Entrega
- Criado `apps/web/src/sales.ts` como modulo de dominio comercial frontend.
- Movidos para o modulo:
  - tipos de campanhas, snapshots, ranking e jobs;
  - builders de campanha;
  - parser/comparador de snapshots;
  - labels e tons de status de job.
- `apps/web/src/main.tsx` agora importa os contratos/helpers comerciais em vez de concentrar essa logica.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- `main.tsx` ainda segue grande; proxima rodada deve extrair views por dominio com testes/Playwright quando possivel.
