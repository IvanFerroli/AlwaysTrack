# TASK-AT-222 - CaseFlow Security: enforcement do action firewall

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-222-action-firewall-enforcement.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
Security / Action Firewall

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 19.3

## Objetivo unico
Implementar enforcement central para que qualquer executor/conector execute apenas capabilities declaradas pelo no, conector e politica atual.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-199`, `TASK-AT-200`, `TASK-AT-221`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-199`, `TASK-AT-200`, `TASK-AT-221`.

## Alvos explicitos
1. services/api/src/core/case-flow/action-firewall.ts
2. services/companion-host/src/security/action-firewall.ts
3. apps/companion-extension/src/shared/action-firewall.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Validar capability, conector, alvo, risco e confirmacao.
2. Negar ferramenta generica de clique/seletor arbitrario.
3. Auditar tentativa bloqueada.

## Acceptance Criteria
1. Capability nao declarada falha fechada.
2. Acoes proibidas nao possuem caminho de execucao.
3. O enforcement existe antes de qualquer escrita/draft.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 19.3 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Implementacao duplicada divergir entre host e extensao.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-223`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
