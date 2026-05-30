# EXEC-AT-009 - Commercial filters round

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-05-30
- source-of-truth: docs/tasks/EXEC-AT-009-execution.md

## Escopo
Transformar filtros comerciais que ja existiam no backend em fluxo operacional visivel para ranking e extratos.

## Entregue
1. `AT-019B` parcial: filtros visuais de Ranking por campanha, grupo e periodo.
2. `AT-021B` parcial: filtros visuais de Extratos por campanha, grupo, vendedor e periodo.
3. CSV de extrato preserva os mesmos filtros da tela.
4. Dropdowns reutilizam campanhas e documentos visiveis pelo escopo do usuario.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- `npm run smoke:beta-local`

## Residual
- CRUD de campanhas.
- Snapshots historicos de ranking.
- Consolidado visual de extratos por vendedor/grupo.
- Editor granular de nota continua sendo prioridade alta em `AT-018B`.
