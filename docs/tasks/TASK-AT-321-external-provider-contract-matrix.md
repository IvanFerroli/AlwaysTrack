# TASK-AT-321 - Integracoes externas: matriz de contratos, sandboxes e degradacao

## Metadata
- status: implementation-complete-sandbox-live-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-321-external-provider-contract-matrix.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Integrations

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Cobrir Google, Meta/WhatsApp, OpenAI e demais providers com mocks fiéis, sandbox quando disponivel e degradacao segura.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-110, TASK-AT-287, TASK-AT-288.

## Alvos explicitos
1. services/api/src/core/integrations/**
2. tests/contracts/providers/**
3. Runbook operacional de validacao externa, pendente para a rodada autorizada de sandbox/live.

## Recorte autorizado nesta execucao
- Implementacao local em `services/api/src/core/integrations/**` e testes dos providers existentes.
- `tests/contracts/providers/**` foi materializado junto ao ownership da API como
  `services/api/src/core/integrations/provider-contract-matrix.test.ts`, onde o runner Vitest vigente o executa.
- O runbook operacional de validacao externa, contratos OpenAPI, manifests de pacote, lockfile,
  workflows, `ROADMAP.md`, rede e credenciais ficaram explicitamente fora desta execucao.

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Versionar exemplos sanitizados de request/response e erros.
2. Separar testes offline obrigatorios de smokes live manuais.
3. Testar timeout, rate limit, credencial ausente, resposta invalida e indisponibilidade.

## Acceptance Criteria
1. Cada provider ativo possui contrato, owner e estrategia de teste.
2. CI nao exige credenciais reais.
3. Smokes live registram ambiente e redaction sem promover rollout automaticamente.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Implementacao local
- Matriz executavel e tipada em `services/api/src/core/integrations/provider-contract-matrix.ts`.
- Providers cobertos: Google OAuth/Sheets, Meta WhatsApp, OpenAI, Gemini, fake de notificacao e fake de Document AI.
- Cenarios remotos obrigatorios: sucesso, credencial ausente, timeout, rate limit, resposta invalida,
  indisponibilidade e redaction.
- Mocks reproduzem status HTTP, envelopes de sucesso/erro, respostas truncadas e falhas de transporte
  sem abrir conexoes de rede.
- A matriz referencia as suites locais existentes por provider, incluindo OAuth e Google Sheets/Drive,
  para manter contrato, owner e estrategia de teste executavel no runner atual.
- Sanitizacao comum cobre campos aninhados e segredos em texto, bearer headers, cookies e query strings.
- Timeouts declarados e observados: 15 segundos para Google/Meta e 30 segundos para OpenAI/Gemini.

## Estado por ambiente
- fake/local: implementado e automatizado; evidencia exclusivamente `local/fake`.
- sandbox Google: pendente por projeto e credenciais de teste autorizados indisponiveis.
- sandbox Meta/WhatsApp: pendente por numero de teste e credenciais autorizados indisponiveis.
- sandbox OpenAI/Gemini: pendente por projeto, quota/orcamento e credenciais autorizados indisponiveis.
- live: pendente para todos os providers; exige autorizacao, ambiente identificado e evidencia redigida.
- Nenhum resultado local promove rollout, sandbox ou live automaticamente.

## Riscos residuais locais
- Mocks podem divergir de mudancas futuras dos providers; sandbox continua obrigatorio antes de rollout.
- OpenAI/Gemini atualmente propagam erro interno ao receber HTTP 200 com JSON invalido. A matriz comprova
  falha fechada e sanitizada, mas a normalizacao do erro de producao ficou fora do ownership desta execucao.
- Fakes comprovam determinismo/degradacao somente e nunca constituem evidencia live.

## Evidencia local 2026-07-15
- Sete suites focadas passaram com 53 testes, cobrindo a matriz, HTTP externo, Google OAuth/Sheets, Meta/WhatsApp, OpenAI, Gemini e fakes.
- Integridade documental e higiene do repositorio passaram; nenhum segredo, dado real ou chamada de rede foi usado.
- Classificacao: `local/fake`. Typecheck/build agregado e commit SHA pertencem ao handoff do orchestrator por haver implementacao OpenAPI concorrente no mesmo workspace.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Mocks divergirem silenciosamente do provider real.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-322

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
