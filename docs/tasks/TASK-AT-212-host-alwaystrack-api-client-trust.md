# TASK-AT-212 - Companion Host: cliente API AlwaysTrack e confianca local

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-212-host-alwaystrack-api-client-trust.md

## Modo
- mode: contracts
- generation-mode: corrective-spec-breakdown

## Capability
Companion Host / API Trust

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 22, 23, 25

## Objetivo unico
Definir e preparar o cliente do Host para a API AlwaysTrack, representando usuario autenticado, instalacao local, caseId e permissao de escrita de fatos.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-196`, `TASK-AT-201`, `TASK-AT-211`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-196`, `TASK-AT-201`, `TASK-AT-211`.

## Alvos explicitos
1. services/companion-host/src/protocol/
2. docs/security/caseflow-trust-topology.md
3. services/api/src/core/case-flow/
4. services/api/src/core/auth/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Definir como o host recebe credencial local sem usar senha de sistemas externos.
2. Correlacionar userId, installationId, browser profile, caseId e runId.
3. Bloquear injecao de fatos por processo local nao pareado.
4. Definir emissao, rotacao e revogacao de credencial local do Companion na API AlwaysTrack.
5. Definir middleware/guard especifico para mutacoes vindas do Companion, sem depender apenas do cookie web.
6. Definir rate-limit proprio para ingestao progressiva do Companion.
7. Testar injecao local por processo nao pareado e credencial revogada.

## Acceptance Criteria
1. Host chama apenas rotas permitidas e autenticadas.
2. Fatos enviados carregam origem, runId e instalacao.
3. Dados proibidos por fronteira nao sao enviados.
4. A API possui caminho claro para emitir, revogar e validar credenciais locais do Companion.
5. O modelo nao transforma o Host em backdoor para rotas autenticadas comuns.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 22, 23, 25 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Host virar backdoor local para API autenticada.
- Credencial local reutilizada fora do perfil/instalacao/caseId autorizado.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-213`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
