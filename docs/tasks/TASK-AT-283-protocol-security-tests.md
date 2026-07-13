# TASK-AT-283 - CaseFlow: testes de seguranca do protocolo local

## Metadata
- status: implementation-complete-manual-topology-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-283-protocol-security-tests.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
Security / Protocol Tests

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 22.2, 25, 27.5

## Objetivo unico
Testar token invalido, origem invalida, porta nao exposta, payload grande, rate limit, redaction e injecao local nao autorizada.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-196`, `TASK-AT-211`, `TASK-AT-212`, `TASK-AT-221`, `TASK-AT-222`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-196`, `TASK-AT-211`, `TASK-AT-212`, `TASK-AT-221`, `TASK-AT-222`.

## Alvos explicitos
1. services/companion-host/src/security/*.test.ts
2. apps/companion-extension/src/**/*.test.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Simular processo local nao pareado tentando enviar facts.
2. Testar payload oversized e origem arbitraria.
3. Testar rotacao/revogacao de token local.

## Acceptance Criteria
1. Conexao nao autorizada falha fechada.
2. Fatos injetados sem instalacao pareada sao rejeitados.
3. Logs nao vazam payload sensivel.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 22.2, 25, 27.5 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Assumir que localhost e sempre confiavel.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-284`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
