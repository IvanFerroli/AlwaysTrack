# TASK-AT-325 - Seguranca: enforcement de SAST, SCA, secrets e licencas no CI

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-325-ci-application-security-enforcement.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Security / CI

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Materializar gates de seguranca automaticos com politica de excecao auditavel e prazo.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-112, TASK-AT-116, TASK-AT-310.

## Alvos explicitos
1. .github/workflows/check.yml
2. .github/dependabot.yml
3. scripts/check-repo-hygiene.js
4. docs/operations/security-dependency-ci-gates.md

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Executar SCA de producao e desenvolvimento, SAST e secret scan com historico.
2. Gerar inventario de licencas e bloquear classes proibidas.
3. Definir permissoes minimas, timeouts e excecoes com owner/expiracao.

## Acceptance Criteria
1. Achado acima do limiar bloqueia o CI.
2. Scanner cobre historico e artefatos relevantes sem imprimir segredo.
3. Toda excecao e versionada, justificada e expira.

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
- Falso positivo paralisar o fluxo sem processo de triagem.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-326

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Resultado de implementacao
- CI bloqueia SCA de producao e desenvolvimento no limiar alto, CodeQL SAST com `security-severity >= 7.0` ou nivel `error`, segredos no snapshot/historico e licencas proibidas ou sem excecao vigente.
- Dependabot cobre npm e GitHub Actions semanalmente; jobs possuem permissoes minimas e timeouts.
- Excecoes de qualidade e licenca exigem justificativa, owner e expiracao, validados por `repo:hygiene`.
- Evidencia: local em 2026-07-15; `npm run security:deps` e `npm run repo:hygiene` passaram. CodeQL permanece como evidencia de CI, nao live.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
