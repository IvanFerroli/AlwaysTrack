# TASK-AT-197 - Companion: threat model da extensao e host local

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-197-companion-extension-threat-model.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
Security / Threat Model

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.8 a 4.11, 22, 25, 36

## Objetivo unico
Criar modelo de ameacas especifico para extensao MV3, leitura DOM, host local, pairing, cookies proibidos, permissoes de browser e acao por capability.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-194`, `TASK-AT-195`, `TASK-AT-196`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-194`, `TASK-AT-195`, `TASK-AT-196`.

## Alvos explicitos
1. docs/security/companion-threat-model.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Cobrir DOM scraping consultivo e ausencia de bypass de login/captcha/2FA.
2. Listar ameacas de processo local malicioso, extensao falsa, porta exposta e permissao host excessiva.
3. Mapear mitigacoes para tasks de protocolo, firewall, redaction e testes negativos.

## Acceptance Criteria
1. Threat model cobre extensao, host e protocolo local.
2. Acoes criticas proibidas aparecem como riscos mitigados.
3. O documento complementa, sem substituir, o threat model geral.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 4.8 a 4.11, 22, 25, 36 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Subestimar risco de extensao com acesso a paginas reais.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-198`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
