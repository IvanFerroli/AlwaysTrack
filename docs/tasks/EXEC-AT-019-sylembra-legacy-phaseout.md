# EXEC-AT-019 - SyLembra legacy phaseout

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-03
- tasks: AT-023, AT-027

## Entregue
- Login e manifesto PWA passaram a comunicar o recorte comercial do AlwaysTrack.
- Manifesto `TASK-AT-027-decommission-sylembra-legacy.md` criado com mapa de residuos, fases e riscos.
- Rotas autenticadas do vertical antigo ficaram opt-in via `ENABLE_LEGACY_SYLEMBRA=true`.
- `.env.example` documenta o legado SyLembra desligado por padrao.
- Wiki comercial deixou de aceitar `RT` como role ativa por padrao nas rotas.
- `TASK-AT-023` foi promovida para `completed-mvp`.

## Preservado
- Schema Prisma antigo e services legados continuam no codigo para evitar migracao destrutiva nesta fase.
- Seed ainda cria fixtures antigas; a remocao fica para fase propria, junto de ajustes de testes/smoke.
- Rotas publicas antigas de upload/FAQ/help ainda existem por compatibilidade.

## Validacao planejada
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`

## Proxima fase recomendada
- `AT-027B`: seed comercial sem fixtures SyLembra, help comercial e desativacao de rotas publicas antigas.
