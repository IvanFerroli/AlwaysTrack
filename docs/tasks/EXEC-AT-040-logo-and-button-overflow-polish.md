# EXEC-AT-040 - Logo and button overflow polish

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-09
- tasks: TASK-AT-056

## Entrega
- Logo da marca apontado para PNG real do pacote novo.
- Marca/logo extraida para `apps/web/src/components/brand.tsx`.
- Wrapping de texto aplicado a botoes e listas Wiki/FAQ.
- Thread list e pagina list protegidas contra overflow horizontal/vertical de texto.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`
