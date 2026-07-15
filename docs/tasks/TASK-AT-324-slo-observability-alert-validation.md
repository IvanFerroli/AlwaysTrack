# TASK-AT-324 - Observabilidade: SLOs, telemetria correlacionada e alertas exercitados

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-324-slo-observability-alert-validation.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Operations / Observability

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Transformar metricas locais em sinais operacionais com SLO, correlacao e alertas testaveis.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal e instrumentacao local da TASK-AT-284.
- em aberto: TASK-AT-323 para calibracao production-like e TASK-AT-335 para roteamento/aprovacao operacional.

## Alvos explicitos
1. services/api/src/core/diagnostics/**
2. services/companion-host/src/diagnostics/**
3. docs/operations/security-monitoring-alerts.md
4. docs/performance/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Cobrir API, jobs, banco, storage, conectores, Host e Extension.
2. Correlacionar requestId, caseId e runId sem dados pessoais.
3. Exercitar alertas de erro, latencia, fila, drift e indisponibilidade.

## Acceptance Criteria
1. SLIs e budgets possuem formula, owner e janela.
2. Alertas sao disparados e resolvidos em teste controlado.
3. Dashboard diferencia falha parcial, degradacao e indisponibilidade.

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
- Coletar telemetria sensivel ou de alta cardinalidade.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-325

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
- SLOs de erro, latencia, fila, dependencias, conectores, drift e Companion possuem formula, threshold, owner e janela inicial documentados.
- Avaliador API produz alertas allowlisted, dashboard com quatro estados e transicoes `FIRING`/`RESOLVED`.
- Correlacao preserva request/run IDs seguros e converte case ID em SHA-256; erros, URLs, payloads e PII nao sao transportados.
- Companion Host diferencia estado saudavel, falha parcial, degradacao e indisponibilidade por contadores limitados.
- Testes controlados disparam e resolvem alertas e validam redaction; API e Host passam typecheck.
- Evidencia `local`/fake. Alert manager, pager, dashboards externos e calibracao por carga continuam pendentes, sem promocao a production-like/live.
