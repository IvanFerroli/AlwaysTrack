# Taskyfier Memory

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/operations/taskyfier-memory.md

## Estado atual
- Backlog formal ativo foi limpo ate `TASK-AT-101` antes desta rodada.
- `TASK-AT-121`: completed. `npm run up` virou bancada local completa de estudo/apresentacao.
- `TASK-AT-122`: completed. Auditoria recente de testes/docs criada.
- Backlog formal aberto: `TASK-AT-074`, bloqueada por prints reais.
- Padrao solicitado pelo usuario: quando ele pedir pipeline, usar Taskyfier + Orchestrator como fluxo padrao mesmo sem mencao `@` funcional.

## Regras para proximas taskificacoes
1. Nao reabrir tasks concluidas sem motivo explicito.
2. Follow-ups tecnicos devem ficar listados ate o usuario priorizar.
3. Coverage, infra de deploy, validacao runtime completa e anexos auditaveis sao bons candidatos futuros, mas nao estao ativos.


## Frente CaseFlow Engine + AlwaysTrack Companion
- Fonte canonica: `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`.
- Backlog corretivo materializado de `TASK-AT-194` a `TASK-AT-307` em 2026-07-11.
- Relatorio de revisao externa: `docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md`.
- Proxima task recomendada: `TASK-AT-194-caseflow-architecture-boundaries.md`.
- Gate antecipado obrigatorio: `TASK-AT-195-windows-wsl-chrome-topology-spike.md` antes de implementar extensao/host dependentes de Windows + WSL + Chrome.
- Nenhuma implementacao, dependencia, credencial ou scraping real foi executado nesta rodada.
