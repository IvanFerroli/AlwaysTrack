# TASK-AT-332 - Runtime: readiness, shutdown gracioso e lifecycle de dependencias

## Metadata
- status: completed-local
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-332-runtime-readiness-graceful-lifecycle.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Operations / Runtime Lifecycle

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Separar liveness/readiness e garantir encerramento controlado de HTTP, Prisma, Redis, jobs e WebSocket.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-310, TASK-AT-320, TASK-AT-324.

## Alvos explicitos
1. services/api/src/main.ts
2. services/companion-host/src/main.ts
3. deploy/**
4. docs/operations/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Validar readiness por dependencia critica sem expor detalhes sensiveis.
2. Testar SIGTERM, timeout de drain, cancelamento e reinicio.
3. Definir rotacao/retenção de logs e comportamento em dependencia degradada.

## Acceptance Criteria
1. Orquestrador remove instancia nao pronta sem restart loop.
2. Shutdown respeita prazo e nao aceita trabalho novo durante drain.
3. Jobs e sockets nao duplicam trabalho apos reinicio.

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
- Readiness acoplada a dependencia opcional causar indisponibilidade.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-333

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
- O processo HTTP passou a expor liveness independente em `/health/live` e readiness de Prisma/Redis em `/health/ready`, com timeout e respostas sanitizadas.
- Readiness degradada retorna `503` sem encerrar o processo; durante drain, novas requisicoes tambem recebem `503` e conexoes keep-alive sao fechadas.
- `SIGTERM` e `SIGINT` compartilham shutdown idempotente e limitado por prazo para HTTP e Prisma, com suporte tipado para closers residentes de jobs, WebSocket e Redis.
- A arquitetura atual foi preservada: Worker BullMQ roda em entrypoint separado, nao ha WebSocket na API e as conexoes Redis da API sao transitorias. Nenhuma dependencia ficticia foi criada.
- Testes cobrem probes, timeout de dependencia, drain, deadline forcado, idempotencia, sinais, ordem de recursos e reinicio local.
- Smoke local do binario compilado validou `/health`, `/health/live` e `/health/ready` em porta isolada; `SIGINT` concluiu drain e desconexao com exit code 0. Docker, Compose e o candidato de release usam readiness no healthcheck.
- Evidencia classificada como `local`, sem Redis real, orquestrador, credenciais ou sistemas externos. A verificacao production-like permanece pendente das TASK-AT-320 e TASK-AT-324.
