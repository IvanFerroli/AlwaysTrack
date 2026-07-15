# TASK-AT-316 - API: OpenAPI versionado e testes de contrato HTTP

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-316-http-openapi-contract-tests.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Contracts / HTTP

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Formalizar rotas criticas e detectar drift entre handlers, consumidores, exemplos e respostas runtime.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal, `TASK-AT-107`, `TASK-AT-299` e `TASK-AT-310`.
- em aberto: nenhuma para o contrato P0 local/CI.

## Alvos explicitos
1. `docs/api/openapi.v1.yaml`
2. `services/api/src/contracts/openapi.ts`
3. `services/api/src/contracts/openapi.contract.test.ts`
4. `scripts/validate-openapi-contract.mjs`

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Documentar autenticacao, erros, paginacao e schemas das rotas ativas.
2. Validar requests/responses contra o contrato no CI.
3. Cobrir consumidores Web e Companion sem duplicar tipos concorrentes.

## Acceptance Criteria
1. Rotas P0 possuem contrato versionado e exemplos validos.
2. Drift de schema ou status HTTP falha no CI.
3. Dados sensiveis nao aparecem em exemplos.

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
- Gerar contrato decorativo que nao valida o runtime.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-317

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
- OpenAPI `3.1.0` versionado em `1.0.0`, armazenado como JSON compativel com YAML para parsing deterministico sem dependencia.
- Vinte e quatro operacoes P0 cobrem login/sessao, caminho vertical CaseFlow, evidencias, conflitos, resolucao, plano, sessao guiada, mensagens, metricas, consultas administrativas essenciais e fronteira Companion.
- Autenticacao por cookie e credencial Companion, papeis, rate limiting, status de sucesso/erro, parametros, requests, responses e exemplos sinteticos estao explicitos.
- O teste importa os enums de `@alwaystrack/shared`, impedindo tipos HTTP concorrentes para papeis, estados de caso, freshness, sensitivity e acquisition.
- O gate inspeciona as rotas realmente registradas pelo Express, handler, `requireAuth`, metodo, path e status de sucesso; tambem abre servidor apenas em loopback e confirma o envelope `401` antes de persistencia.
- Referencias locais e exemplos sao verificados contra o subconjunto de JSON Schema usado pelo contrato; exemplos com CPF, telefone, email nao reservado ou credencial falham.
- `scripts/validate-openapi-contract.mjs` fornece uma verificacao estatica rapida contra `services/api/src/app.ts`; o teste Vitest e descoberto pelo gate API ja executado no CI, sem alterar manifests ou workflows.
- Rotas ativas fora do caminho P0 permanecem fora desta versao inicial e devem entrar por priorizacao P1/P2, sem inferencia de cobertura integral da API legada.
- Evidencia classificada como `local/fake`: somente loopback, payloads sinteticos, sem banco externo, credenciais ou sistemas live.
