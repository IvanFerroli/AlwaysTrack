# TASK-AT-333 - Evidencias: manifesto padrao e pacote reproduzivel de apresentacao

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-333-evidence-manifest-presentation-pack.md

## Modo
- mode: documentation
- generation-mode: project-wide-readiness-coverage

## Capability
Governance / Evidence

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Padronizar evidencia com commit, ambiente, versoes, comandos, resultados, hashes, redaction e aprovacao.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal e TASK-AT-308 concluidos.
- em aberto nao bloqueante: TASK-AT-330 permanece planned para automatizar integridade documental; o schema e o pack possuem validacao propria.

## Alvos explicitos
1. docs/operations/evidence-manifest.schema.json
2. docs/demo/presentation-evidence-pack.md
3. .github/pull_request_template.md

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. [x] Definir schema e formato para evidencia automatica, manual, fake, local, production-like e live.
2. [x] Gerar pacote da demo com roteiro, fallback offline e riscos aceitos.
3. [x] Impedir que screenshot ou relato sem contexto feche gate tecnico.

## Acceptance Criteria
1. [x] Toda evidencia identifica commit, UTC, ambiente, operador e resultado.
2. [x] Artefatos possuem checksum SHA-256 e classificacao de sensibilidade.
3. [x] Pacote separa prontidao de demo, rollout e exposicao externa.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Validacoes executadas
- Ambiente: `local`; data: 2026-07-15 UTC; commit-base: `f03f2c949907b7a9f3f92f8fde30f70cb906c0ba`.
- Operador: `olympus_taskyfier` / task executor; checkout `dirty`, inadequado para aprovar release.
- Revisao manual: schema exige contexto, comandos/manuais, SHA-256, sensibilidade, redaction e aprovacao; pack mantem tres decisoes independentes.
- Comandos e exit codes: parse JSON do schema/exemplo (0), `ajv compile --spec=draft2020` com `ajv-formats` (0), `ajv validate --spec=draft2020` do exemplo (0), `npm run typecheck --workspaces --if-present` (0), `npm run repo:hygiene` (0), `git diff --check` (0).
- Artefatos: schema SHA-256 `41e4574e61564401134b0fddf0174bb402309041b3ae3ccf8cde66f588d30196` (`public`); pack SHA-256 `9bf2f132c85b00a9f0495ede631473010fb8d4df762a7a8df5d6b5cdb0b9ed56` (`internal`, exemplo redigido); PR template SHA-256 `396654de1b5aea5b14221c10c8dc7e93e49390d65fb9bb940eaf2a7e8091c467` (`public`).
- Risco residual: validacao de formato nao prova ambiente alvo; TASK-AT-330 ainda deve incorporar checks documentais automatizados.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Incluir segredos ou dados pessoais no pacote compartilhavel.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-334

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
