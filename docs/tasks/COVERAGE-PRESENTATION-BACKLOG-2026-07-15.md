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
| Web | 6.82% | 57.40% | 31.29% | prioridade maxima; varias views em 0% |
| SmartScript | 80.59% | 72.44% | 91.48% | CLI/storage atribuidos; quatro arquivos criticos aprovados |
| Shared | 71.20% | 85.44% | 88.60% | firewall canonico em 100%; piso global elevado |
| Extension | 61.23% | 73.86% | 78.22% | saudavel, ampliar runtime MV3 critico |
| API | 68.82% | 67.03% | 64.88% | ampliar handlers e entrypoints |
| Companion Host | 89.84% | 80.88% | 93.33% | manter piso e evitar regressao |

## Ordem de execucao
1. TASK-AT-337: inventario executavel e mapa de risco. Concluida localmente.
2. TASK-AT-338: painel comparativo no Presentation Hub. Concluida localmente.
3. TASK-AT-339: primeiro marco Web em 10%.
4. TASK-AT-340: Web Scriptoteca, Wiki e Notas em 20%.
5. TASK-AT-341: Web operacional, Fluxos e CaseFlow em 30%.
6. TASK-AT-342: SmartScript CLI/storage com coverage atribuivel. Concluida localmente.
7. TASK-AT-343: bootstrap e fronteiras MV3 da Extension.
8. TASK-AT-344: action firewall e contratos Shared. Concluida localmente.
9. TASK-AT-345: harness HTTP e funcoes de handlers API.
10. TASK-AT-346: workflows API e encerramento da excecao de 75%.
11. TASK-AT-347: branches residuais do Companion Host.
12. TASK-AT-348: gate final e ensaio da apresentacao de coverage.

## Guardrails
- Nenhum fonte pode ser excluido apenas para elevar percentual.
- E2E sem atribuicao V8 continua valioso, mas nao pode ser contado como line coverage.
- Threshold so sobe depois que o novo baseline passa localmente e no CI.
- O hub deve mostrar percentual bruto, piso, delta, commit e frescor; nao criar nota composta enganosa.
- Contadores `0/0` devem aparecer como `N/A`, nunca como 100% util.
- Numerador e denominador devem permanecer visiveis para linhas, statements, branches e funcoes.
- Evidencia local nao promove readiness production-like ou live.
