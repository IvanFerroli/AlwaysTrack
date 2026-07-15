# TASK-AT-323 - Performance: carga mista, stress, spike, soak e backpressure

## Metadata
- status: implementation-complete-production-like-execution-pending
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-323-mixed-load-stress-soak-resilience.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Performance / Resilience

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Medir leitura, escrita, CaseFlow, filas e reconnect sob carga representativa e sustentada.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-284, TASK-AT-285, TASK-AT-320.

## Alvos explicitos
1. tests/performance/**
2. scripts/perf-report.js
3. docs/performance/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Definir workload e massa sintetica por jornada.
2. Adicionar thresholds de erro, p95/p99, fila, CPU e memoria.
3. Cobrir stress, spike, soak, cancelamento, cache stampede e backpressure.

## Acceptance Criteria
1. Cada cenario declara ambiente, volume, duracao e criterio de parada.
2. Threshold violado falha a execucao e gera relatorio.
3. Resultado local e distinguido de evidencia production-like.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Alegar capacidade de producao com benchmark local.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-324

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.

## Resultado da execucao 2026-07-15
- `tests/performance/alwaystrack-resilience.yml` define perfis `mixed`, `stress`, `spike` e `soak` com volume, duracao e fases nomeadas.
- A mistura ponderada cobre leituras quentes/cache stampede, escrita e leitura CaseFlow, enqueue/status de snapshot para backpressure e health/readiness/diagnosticos sob contencao.
- O gate falha com erro Artillery acima de 1%, p95 acima de 1 s ou p99 acima de 2 s; readiness, memoria, event loop, fila e reconnect possuem criterios operacionais adicionais no plano.
- `scripts/validate-performance-plan.mjs` falha fechado se perfil, fase, peso, jornada ou threshold obrigatorio desaparecer.
- Um VU `mixed` foi executado contra a bancada SQLite isolada em `127.0.0.1:3334`: 13 requests, 13 respostas 200, zero VU falho, p95/p99 de 47,9 ms. O resultado prova apenas parsing, autenticacao e o caminho de leitura sorteado.
- Nenhuma carga pesada foi disparada contra o ambiente de desenvolvimento compartilhado. A evidencia desta rodada e `local` para estrutura/validacao do plano; execucoes production-like dos quatro perfis continuam obrigatorias.
- Dependencias AT-284/285 fornecem os gates CaseFlow existentes; AT-320 continua aberta para Postgres/Redis/storage equivalentes ao alvo e impede declarar capacidade ou concluir integralmente esta task.
