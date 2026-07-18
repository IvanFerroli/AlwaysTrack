# TASK-AT-396 - Excecoes, dobra e slot extra de Escalas SAC

## Metadata
- status: implemented-partial-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-396-sac-schedule-exceptions-double-extra-slots.md

## Modo
- mode: implementation

## Objetivo unico
Governar folga, ausencia, ajuste, dobra e intervalo extra como deltas aprovados sobre a escala efetiva.

## Contexto minimo
Excecao nao deve editar turno-base nem substituir o dia inteiro sem provenance. Dobra/slot extra altera capacidade e pode exigir limites e aprovacao reforcada.

## Dependencias
- satisfeitas: TASK-AT-392 e TASK-AT-395.
- em aberto: folga, ausencia, ajuste, revogacao e override como workflow de excecao; limites, descanso e aprovacao de extra ja sao revalidados pela regra efetiva.

## Estado reconciliado em 2026-07-18
- Slot extra e dobra sao representados por candidatura aprovada e ocorrencia `EXTRA`/`DOUBLE`, com snapshot e auditoria. A taxonomia completa de excecoes e o preview antes/depois nao foram implementados.

## Alvos explicitos
1. APIs de solicitar, revisar, aprovar, rejeitar e revogar excecao.
2. Regras de conflito, descanso e impacto de capacidade.
3. UI gerencial com preview antes/depois.

## Fora de escopo
- Calculo de folha, banco de horas ou pagamento.
- Override silencioso de regra trabalhista.

## Checklist
1. Tipar motivo, intervalo, origem, requerente e aprovador.
2. Validar sobreposicao, descanso, membership e vigencia da regra.
3. Recompilar apenas o dia futuro afetado apos aprovacao.
4. Exigir confirmacao reforcada/justificativa para override permitido.
5. Revogar por evento compensatorio e preservar antes/depois.

## Acceptance Criteria
1. Dobra/slot extra aparece como intervalo adicional, nao como novo turno-base.
2. Apenas estado APPROVED altera escala efetiva e cobertura.
3. Conflitos concorrentes produzem `409` sem estado parcial.
4. Historico explica regra violada, override, ator e efeito na capacidade.

## Validacao
- comandos/checks: testes state machine/RBAC/concorrencia/auditoria e Web.
- revisao manual: folga, ajuste parcial, dobra, rejeicao e revogacao.

## Riscos
- Confundir slot extra de trabalho com slot de Pausa.

## Proximo passo provavel
TASK-AT-397

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nomenclatura e tipos distintos para trabalho extra e Pausa.
