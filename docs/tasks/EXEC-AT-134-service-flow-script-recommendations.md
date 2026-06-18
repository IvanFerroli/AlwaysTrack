# EXEC-AT-134 - Recomendacao de scripts por etapa do fluxo

## Resultado
- status: completed-mvp
- date: 2026-06-18
- task: docs/tasks/TASK-AT-134-service-flow-script-recommendations.md

## Entrega
O cadastro de etapas passou a sugerir scripts relacionados com base em tags do fluxo, texto da etapa, titulo da etapa e uso do script. As sugestoes aparecem como botoes compactos e adicionam o script a etapa sem criar vinculo automatico silencioso.

## Arquivos
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/styles.css`

## Validação
- `npm run typecheck --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- A recomendacao ainda e heuristica local no frontend. Uma versao futura pode mover scoring para backend e considerar historico de execucao real.
