# TASK-AT-309 - Qualidade: baseline deterministico e gate verde real

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-309-deterministic-green-test-baseline.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Quality / Baseline

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Eliminar a falha temporal atual e garantir que testes existentes de todos os workspaces participem do gate raiz.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-308.

## Alvos explicitos
1. services/api/src/core/quality/main-flow.e2e.test.ts
2. packages/shared/package.json
3. package.json

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Tornar fixtures de expiracao independentes do relogio de calendario.
2. Adicionar o script de teste ausente ao workspace Shared.
3. Provar que o gate falha quando uma suite de workspace falha ou deixa de ser descoberta.

## Acceptance Criteria
1. A suite agregada passa em qualquer data suportada.
2. Os testes de Shared aparecem explicitamente no output do gate.
3. Nenhum workspace com testes e omitido por --if-present.

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
- Mascarar a falha temporal alterando apenas a data fixa.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-310

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Resultado de implementacao
- Relogio do fluxo principal congelado em uma referencia controlada e restaurado apos cada teste; prazos continuam relativos ao relogio do cenario.
- Shared possui suite Vitest obrigatoria e aparece no gate agregado.
- O gate raiz nao usa `--if-present`; workspaces sem suite exigem excecao versionada, com owner e expiracao.
- Evidencia: local/fake em 2026-07-15; `npm run test:integration`, testes de Shared, `npm run repo:hygiene` e `git diff --check` passaram.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
