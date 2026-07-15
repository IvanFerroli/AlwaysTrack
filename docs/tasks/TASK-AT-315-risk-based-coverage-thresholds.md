# TASK-AT-315 - Coverage: thresholds incrementais por workspace e risco

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-315-risk-based-coverage-thresholds.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Coverage

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Expandir coverage alem da API e impedir regressao em modulos alterados com metas incrementais realistas.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal, TASK-AT-310 e TASK-AT-311.
- em aberto: nenhuma dependencia para o gate local/CI; aumento progressivo permanece continuo.

## Alvos explicitos
1. package.json
2. apps/*/package.json
3. services/*/package.json
4. packages/*/package.json
5. .github/workflows/check.yml

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Gerar cobertura para API, Web, Shared, Extension, Host e SmartScript.
2. Definir piso por workspace e piso maior para contratos, auth, firewall e parsers.
3. Publicar resumo e artefato HTML no CI.

## Acceptance Criteria
1. Todos os workspaces testaveis publicam coverage.
2. Reducao abaixo do baseline bloqueia a mudanca.
3. Arquivos criticos possuem meta explicita e owner.

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
- Otimizar percentual sem melhorar cenarios de risco.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-316

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
- Os seis workspaces publicam coverage V8 sobre todos os fontes `src`, com summary JSON/texto e HTML.
- Cada workspace possui piso global abaixo do baseline medido e metas explicitas para contratos, auth, firewall, parsers, API Web e processamento SmartScript.
- Firewalls de API, Extension e Host e geracao Espanso exigem 100% onde o baseline real sustenta essa meta.
- O CI executa `npm run coverage:check`, bloqueia regressao e publica `workspace-coverage` por 14 dias.
- Politica, owners, baselines, dividas Web/SmartScript e regra de excecao estao em `docs/testing/coverage-policy.md`.
- Validacao local: `npm run coverage:check` passou nos seis workspaces; `npm run check` passou com 632 testes, 1 teste Redis opt-in ignorado e os seis builds aprovados.
- Evidencia classificada como `local`, sem credenciais, sistemas externos ou promocao de rollout.
