# EXEC-AT-127 - Painel de governanca da Scriptoteca

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-127-script-library-governance-dashboard.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- Expandido o painel de gestao da Scriptoteca para leitura gerencial.
- Mantidos indicadores de revisao vencida, sugestoes pendentes, scripts sem uso, mais copiados e buscas sem resultado.
- Adicionada heuristica de duplicados provaveis por titulo normalizado, tags e categoria.
- O painel evita expor texto completo sensivel e trabalha com titulos, contagens e categorias.

## Arquivos principais
- `services/api/src/core/script-library/script-library.service.ts`
- `apps/web/src/views/script-library.tsx`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Os atalhos ainda usam filtros existentes; filtros especificos por "sem uso" e sugestao pendente podem ser promovidos depois.
