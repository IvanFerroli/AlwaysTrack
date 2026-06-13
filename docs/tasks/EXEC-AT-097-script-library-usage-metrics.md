# EXEC-AT-097 - Scriptoteca: metricas de uso e lacunas

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-097-script-library-usage-metrics.md

## Entrega
Criado painel gerencial de uso e lacunas da Scriptoteca, com eventos de busca sem resultado e indicadores para melhoria continua dos textos.

## Escopo coberto
1. Modelo `OperationalScriptSearchEvent` para registrar buscas/filtros e quantidade de resultados.
2. Registro de buscas da Scriptoteca quando ha filtros ou texto pesquisado.
3. Metricas: scripts mais copiados, scripts validados sem uso, revisoes vencidas, sugestoes pendentes e buscas sem resultado.
4. Painel `Uso e lacunas` visivel para Supervisor/Admin.
5. Seed demo com uma lacuna de busca.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts`

## Risco residual
- Ainda nao ha export das metricas; a necessidade pode ser reavaliada depois de uso real.
