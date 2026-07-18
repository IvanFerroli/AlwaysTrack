# TASK-AT-416 - Gate final de Escalas, Notificacoes e Avisos

## Metadata
- status: demo-go-scope-limited-rollout-no-go
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-416-scheduling-final-readiness-gate.md

## Modo
- mode: verification

## Objetivo unico
Emitir decisao reproduzivel de prontidao para demo, rollout interno e exposicao externa da nova frente.

## Contexto minimo
TASK-AT-390 fecha a transformacao SAC original. Este gate adiciona Escalas e recorrencia sem promover screenshot, seed ou teste local a prova de concorrencia/scheduler live.

## Dependencias
- satisfeitas: demonstracao local basica de Escalas/Pausas/Avisos e regressao local de KPIs/Campanhas.
- em aberto: tasks parciais e todas as evidencias production-like/humanas registradas em TASK-AT-415.

## Estado reconciliado em 2026-07-18
- O `GO` vale apenas para demo local do subconjunto existente com seed ficticio. Nao autoriza alegar excecoes completas, resolver backend de notificacao, matriz E2E completa, carga, concorrencia PostgreSQL ou rollback ensaiado.

## Alvos explicitos
1. Matriz requisito -> task -> teste -> evidencia -> owner.
2. Auditoria de fontes de verdade, integridade temporal e acesso.
3. Decisoes separadas GO, GO-WITH-RISK ou NO-GO.

## Fora de escopo
- Corrigir gaps silenciosamente durante o gate.
- Promover evidencia fake/local para production-like/live.

## Checklist
1. Verificar versoes, materializacao, excecoes, trocas e painel.
2. Verificar Pausa subordinada, remarcacao e cobertura dentro do SLO.
3. Verificar target/fallback, Perfil e overlays acessiveis.
4. Verificar 14/29, timezone, vigencia, edicao futura, idempotencia e catch-up.
5. Verificar RBAC, auditoria, observabilidade, testes, coverage, seed, docs e rollback.
6. Registrar lacunas aceitas, validade e owners de follow-up.

## Acceptance Criteria
1. Nenhum invariante critico fica sem evidencia ou waiver com prazo/owner.
2. Demo, rollout interno e exposicao externa recebem decisoes independentes.
3. NO-GO em tenancy, concorrencia, Pausa, scheduler ou rollback nao e compensado por aceite visual.
4. A escala efetiva e comprovadamente a unica fonte ativa de cobertura/Pausa no cutover.

## Validacao
- comandos/checks: `npm run test:all`, `npm run coverage:check`, `npm run repo:hygiene`, rehearsal aplicavel e `git diff --check`.
- revisao manual: sign-off de produto, engenharia, seguranca e operacao.

## Evidencia esperada
- Commit, ambiente, data UTC, comandos/exit codes, manifests, checksums e decisoes assinadas.
- Classificacao fake, local, production-like ou live para cada evidencia.

## Riscos
- Pressao de calendario aceitar scheduler/concorrencia sem ambiente adequado.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: concluir apenas com ledger integral e blockers objetivos resolvidos ou aceitos formalmente.
