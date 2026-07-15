# TASK-AT-317 - Companion: contrato de handshake, rotacao e reconexao

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-317-companion-protocol-reconnect-contract.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Contracts / Companion

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Eliminar drift entre Extension, Host e Shared e provar reconexao com token rotacionado sem replay.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-199, TASK-AT-211, TASK-AT-283, TASK-AT-310.

## Alvos explicitos
1. packages/shared/src/companion/**
2. apps/companion-extension/src/background/protocol-client.ts
3. services/companion-host/src/server/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Usar os mesmos schemas runtime para HELLO, PAIRED, erro e reconnect.
2. Cobrir consumo unico, rotacao, expiracao, rejeicao de replay e reconexao.
3. Manter bind loopback e validacao de Origin fail-closed.

## Acceptance Criteria
1. Cliente e Host aceitam apenas o contrato compartilhado versionado.
2. Reconexao usa token novo e o token consumido e rejeitado.
3. Testes negativos cobrem payload incompleto, replay e origem arbitraria.

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
- Quebrar compatibilidade sem estrategia de versao do protocolo.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-318

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Evidencia de implementacao
- concluido-em: 2026-07-15T11:24:10Z
- ambiente: local, sem credenciais ou sistemas externos
- classificacao: local
- commit: `c0eeb9d87be02e8386596824f04cffef3adcb6c0`
- contrato: schemas runtime compartilhados e versionados para `COMPANION_HELLO`, `COMPANION_PAIRED`, erro de protocolo e grant de reconnect.
- reconnect: cliente substitui o token consumido pelo token rotacionado antes de reconectar; Host valida o HELLO completo antes do consumo.
- negativos: payload incompleto, consumo unico, replay de token/messageId, Origin arbitraria e Origin ausente cobertos localmente.
- preservado: bind `127.0.0.1`, URL `ws://127.0.0.1`, Origin exata e comportamento fail-closed.

## Validacao executada
- `npm run typecheck --workspace @alwaystrack/shared` - exit 0
- `npm run typecheck --workspace @alwaystrack/companion-extension` - exit 0
- `npm run typecheck --workspace @alwaystrack/companion-host` - exit 0
- `npm run test --workspace @alwaystrack/shared` - exit 0, 24 testes
- `npm run test --workspace @alwaystrack/companion-extension` - exit 0, 104 testes
- `npm run test --workspace @alwaystrack/companion-host` - exit 0, 59 testes
- `npm run repo:hygiene` - exit 0
- `git diff --check` - exit 0
- validacao live: nao executada, por restricao explicita de escopo

## Risco residual
- A persistencia do token rotacionado entre reinicios completos do service worker permanece fora deste contrato; a reconexao dentro da instancia ativa esta coberta.
- Nenhum blocker identificado para os criterios locais desta task.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
