# TASK-AT-437 - Gate do MVP de Treinamento, onboarding e simulados

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-437-training-mvp-seed-tests-docs-gate.md

## Modo
- mode: verification
- priority: P1
- generation-mode: initiative-breakdown

## Capability
Training / MVP Readiness

## Origem documental
- `TASK-AT-428` a `TASK-AT-436`.

## Problema
Um simulado pode funcionar visualmente e ainda corromper histórico por republicação, vazar resultados, duplicar tentativa ou contaminar métricas reais. Evidência local também não prova isolamento/concurrency no ambiente alvo.

## Objetivo único
Emitir decisão reproduzível de prontidão para demo e piloto interno do MVP de Treinamento.

## Contexto mínimo
O gate deve demonstrar a premissa completa: Fluxo cadastrado -> treinamento -> cenário -> decisão/resposta -> feedback -> resultado/progresso.

## Inputs
- Implementações/evidências das tasks `AT-428` a `AT-436`.
- Harnesses API/Web/E2E, seed e quality gates existentes.
- Um FlowVersion sanitizado representativo.

## Escopo
1. Seed com duas organizações, equipe, responsáveis, uma trilha, Flow assistido e simulado avaliativo.
2. E2E aluno e responsável, incluindo prazo, notificação, retomada e resultado.
3. Republicar Fluxo/programa com attempt aberto e comparar snapshot/resultado.
4. Assert de zero alteração em métricas/tabelas/eventos operacionais.
5. Matriz anti-IDOR por self/team/org e export.
6. Acessibilidade/mobile, observabilidade, docs de produto/API/operação e decisão GO/NO-GO.

## Fora de escopo
- Corrigir gaps silenciosamente no gate.
- Aprovar correção de open text, mídia nativa, certificado ou IA.
- Declarar produção por evidência SQLite/local.

## Arquivos ou domínios candidatos
- `services/api/prisma/seed.ts`.
- `services/api/src/core/` — testes futuros de Treinamento.
- `apps/web/test/` — testes futuros de Treinamento.
- `tests/` — E2E futuro de Treinamento.
- `docs/demo/` — roteiro futuro do MVP de Treinamento.
- `docs/operations/` — runbook futuro de Treinamento.

## Requisitos funcionais
1. Demo percorre a cadeia completa assistida e avaliativa.
2. Retomada usa o mesmo attempt/versão.
3. Responsável vê somente audiência autorizada.
4. Recurso republicado não altera tentativa/resultado.
5. Treino não muda métricas de atendimento, buscas/cópias operacionais ou casos.

## Requisitos de permissão, tenant e auditoria
1. Matriz cobre take/manage/publish/assign/readTeam/readOrg/review/override.
2. Seed e E2E incluem cross-tenant/cross-team e mudança histórica de equipe.
3. Logs são inspecionados para resposta/gabarito/conteúdo sensível.
4. Publicação, assignment, tentativa, resultado e override possuem requestId/trilha.

## Checklist de execução
1. Criar seed determinístico e roteiro.
2. Executar suites unitárias/HTTP/Web/E2E/a11y.
3. Executar republicação e prova de isolamento métrico.
4. Classificar evidência local/production-like/live.
5. Emitir ledger e decisão por ambiente.

## Critérios de aceite
1. Requisito -> task -> teste -> evidência está completo para o MVP.
2. Snapshot/pinning, tenant e isolamento métrico passam sem waiver crítico.
3. Demo e piloto recebem decisões separadas `GO`, `GO-WITH-RISK` ou `NO-GO`.
4. Fase 2 não é incluída na claim de prontidão.

## Testes esperados
- Suites API/Web/E2E, anti-IDOR, idempotência, snapshot e métricas.
- `npm run check`, `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- Revisão manual desktop/mobile e inspeção de logs/auditoria.

## Riscos
- Mock não detectar escrita operacional indireta.
- Aceitar resultado local como prova de concorrência/rollout.

## Dependências
- satisfeitas: harnesses e gates transversais existentes.
- em aberto: `TASK-AT-428` a `TASK-AT-436`; ambiente e sign-offs definidos.

## Blockers possíveis
- Qualquer contaminação de métricas/sessões operacionais.
- Snapshot incompleto ou falha de autorização nominal.

## Definição de pronto
1. Ledger, manifesto de evidência e decisão assinada entregues.
2. Blockers/waivers possuem owner, prazo e follow-up.
3. Demo reproduzível usa somente dados sanitizados.

## Evidência esperada
- Commit, ambiente, data, comandos/exit codes e classificação da evidência.
- Comparativo antes/depois de métricas/tabelas operacionais.

## Próximo passo provável
`TASK-AT-438` somente após priorização humana da fase 2.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar o gate sem corrigir silenciosamente gaps.
- constraints: NO-GO em isolamento, snapshot ou tenancy não é compensado por aceite visual.
