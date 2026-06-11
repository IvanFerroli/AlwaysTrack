# EXEC-AT-067 - Header/sidebar interpretation correction

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-068-header-sidebar-interpretation-correction.md

## Objetivo
Aplicar a correcao de interpretacao solicitada pelo usuario depois da `TASK-AT-067`.

## Entregas
1. Sidebar renderiza `Perfil` como segunda opcao, logo apos `Dashboard`.
2. Header remove `Perfil` dos atalhos para evitar duplicidade com menu lateral e botao de usuario.
3. Topbar passou a usar layout com linha superior para titulo/usuario e linha inferior full-width para atalhos.
4. Atalhos do header ficam em fila unica no desktop, sem scrollbar horizontal.
5. Mantidas as correcoes anteriores de sidebar colapsavel e cards Wiki/FAQ sem overflow.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

