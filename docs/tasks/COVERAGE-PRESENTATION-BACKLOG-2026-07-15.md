# Backlog de coverage para apresentacao

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/COVERAGE-PRESENTATION-BACKLOG-2026-07-15.md

## Objetivo
Elevar a cobertura onde o risco e o impacto visual sao maiores e apresentar as evidencias de forma honesta, comparavel e navegavel no Presentation Hub.

## Baseline local

| Workspace | Linhas | Branches | Funcoes | Leitura |
| --- | ---: | ---: | ---: | --- |
| Web | 36.74% | 72.05% | 49.34% | conteudo, Dashboard, Fluxos e CaseFlow operacional cobertos |
| SmartScript | 80.59% | 72.44% | 91.48% | CLI/storage atribuidos; quatro arquivos criticos aprovados |
| Shared | 71.20% | 85.44% | 88.60% | firewall canonico em 100%; piso global elevado |
| Extension | 91.17% | 79.29% | 89.70% | bootstrap, side panel e fronteiras MV3 cobertos |
| API | 77.64% | 66.40% | 79.23% | handlers e workflows cobertos; excecao funcional encerrada |
| Companion Host | 97.80% | 89.60% | 98.30% | bootstrap, protocolo e lifecycle cobertos sem recursos reais |

## Ordem de execucao
1. TASK-AT-337: inventario executavel e mapa de risco. Concluida localmente.
2. TASK-AT-338: painel comparativo no Presentation Hub. Concluida localmente.
3. TASK-AT-339: primeiro marco Web em 10%. Concluida localmente.
4. TASK-AT-340: Web Scriptoteca, Wiki e Notas em 20%. Concluida localmente.
5. TASK-AT-341: Web operacional, Fluxos e CaseFlow em 30%. Concluida localmente.
6. TASK-AT-342: SmartScript CLI/storage com coverage atribuivel. Concluida localmente.
7. TASK-AT-343: bootstrap e fronteiras MV3 da Extension. Concluida localmente.
8. TASK-AT-344: action firewall e contratos Shared. Concluida localmente.
9. TASK-AT-345: harness HTTP e funcoes de handlers API. Concluida localmente.
10. TASK-AT-346: workflows API e encerramento da excecao de 75%. Concluida localmente.
11. TASK-AT-347: branches residuais do Companion Host. Concluida localmente.
12. TASK-AT-348: gate final e ensaio da apresentacao de coverage.

## Guardrails
- Nenhum fonte pode ser excluido apenas para elevar percentual.
- E2E sem atribuicao V8 continua valioso, mas nao pode ser contado como line coverage.
- Threshold so sobe depois que o novo baseline passa localmente e no CI.
- O hub deve mostrar percentual bruto, piso, delta, commit e frescor; nao criar nota composta enganosa.
- Contadores `0/0` devem aparecer como `N/A`, nunca como 100% util.
- Numerador e denominador devem permanecer visiveis para linhas, statements, branches e funcoes.
- Evidencia local nao promove readiness production-like ou live.
