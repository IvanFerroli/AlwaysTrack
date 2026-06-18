# EXEC-AT-132 - Fluxos de atendimento com construtor visual de decisoes

## Resultado
- status: completed-mvp
- date: 2026-06-18
- task: docs/tasks/TASK-AT-132-service-flow-visual-decision-builder.md

## Entrega
O editor de etapas ganhou campos visuais para decisoes, sem exigir JSON manual:
- `Sim/Não` com destinos/textos de sim e nao.
- `Decisão` e `Checklist` com lista de opcoes.
- A leitura do fluxo continua mostrando os caminhos como chips.

## Arquivos
- `apps/web/src/views/service-flows.tsx`

## Validação
- `npm run typecheck --workspace @alwaystrack/web`
- `git diff --check`

## Risco residual
- Ainda nao ha fluxograma com desenho de nós e arestas; esta entrega e a camada usavel de cadastro visual.
