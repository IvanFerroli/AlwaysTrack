# EXEC-AT-138 - Seletor de Fluxos por busca e dropdown

## Metadata
- status: completed-mvp
- task: docs/tasks/TASK-AT-138-service-flow-search-dropdown-selector.md
- executed-by: olympus_orchestrator
- completed-at: 2026-06-18

## Entrega
- A lista lateral de botoes foi substituida por busca e dropdown.
- A busca local considera titulo, resumo e tags.
- O painel mostra um resumo compacto do fluxo selecionado.
- Trocar de fluxo limpa sessao ativa e preenche o formulario de script pessoal com o fluxo atual.

## Arquivos principais
- `apps/web/src/views/service-flows.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- Se a base crescer muito, a busca deve ir para backend/paginacao.
