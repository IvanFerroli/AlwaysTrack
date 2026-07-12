# TASK-AT-211 - Companion Host: WebSocket loopback e pairing

## Metadata
- status: implementation-complete-manual-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-211-loopback-websocket-pairing.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Companion Host / Protocol

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 22

## Objetivo unico
Implementar WebSocket autenticado em loopback com pairing token, handshake, origem validada, rate limit e limite de payload.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-195`, `TASK-AT-196`, `TASK-AT-201`, `TASK-AT-210`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- satisfeitas na implementacao: `TASK-AT-195`, `TASK-AT-196`, `TASK-AT-201`, `TASK-AT-210`.
- pendente: evidencias manuais do topology gate (Chrome unpacked, lifecycle WSL/Windows e rede).
- gate operacional obrigatorio: concluir os probes WebSocket, bind e reconexao de `docs/operations/companion-topology-gate.md` como parte desta task.

## Alvos explicitos
1. services/companion-host/src/server/
2. services/companion-host/src/security/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Implementar handshake COMPANION_HELLO/COMPANION_PAIRED.
2. Aplicar token local, rotacao e origem validada.
3. Rejeitar payload grande e conexao externa.

## Acceptance Criteria
1. Token invalido e origem invalida falham.
2. A porta nao fica exposta fora do loopback/topologia validada.
3. Reconexao preserva installationId quando valido.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 22 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Firewall ou NAT Windows/WSL quebrar loopback.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-212`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
