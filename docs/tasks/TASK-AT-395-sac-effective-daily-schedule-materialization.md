# TASK-AT-395 - Materializacao da escala efetiva diaria

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-395-sac-effective-daily-schedule-materialization.md

## Modo
- mode: implementation

## Objetivo unico
Gerar e reconciliar a escala efetiva por atendente/data a partir do turno-base, membership, regra vigente e excecoes aprovadas.

## Contexto minimo
Cobertura e Pausas precisam consultar um snapshot diario deterministico. Calcular recorrencia ad hoc em cada endpoint criaria divergencia e mudanca retroativa.

## Dependencias
- satisfeitas: TASK-AT-394.
- em aberto: horizonte de materializacao e frequencia do job.

## Alvos explicitos
1. Compilador puro de escala efetiva.
2. Job/API dry-run e materializacao por janela.
3. Reconciliacao, idempotencia e estado de erro.

## Fora de escopo
- Aprovar excecao ou troca.
- Alterar dia ja iniciado sem comando operacional explicito.

## Checklist
1. Resolver versao por timezone/data operacional e membership historico.
2. Aplicar precedencia base -> excecao aprovada -> intervalo adicional.
3. Persistir intervals, provenance, checksum e generatedAt.
4. Reprocessar somente dias futuros afetados por nova versao/excecao.
5. Quarentenar conflito sem publicar escala parcial silenciosa.

## Acceptance Criteria
1. Mesmas entradas produzem o mesmo snapshot/checksum.
2. Retry e execucao concorrente nao duplicam dia ou intervalos.
3. Alteracao futura nao reescreve dia passado/iniciado.
4. Falha individual nao corrompe dias validos e fica observavel.

## Validacao
- comandos/checks: golden cases, property tests, job idempotente, timezone/DST e integracao Postgres.
- revisao manual: materializar 30 dias, alterar versao futura e reconciliar delta.

## Riscos
- Horizonte curto deixar painel/cobertura sem escala do proximo dia.

## Proximo passo provavel
TASK-AT-396

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: escala efetiva persistida, explicavel e idempotente.
