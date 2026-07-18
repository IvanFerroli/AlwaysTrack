# TASK-AT-393 - Schema e migracoes aditivas de Escalas SAC

## Metadata
- status: implemented-partial-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-393-sac-scheduling-schema-migrations.md

## Modo
- mode: migration

## Objetivo unico
Persistir turno-base recorrente, versao de regra, escala efetiva, excecao e intervalo adicional sem apagar ou reinterpretar Pausas existentes.

## Contexto minimo
`SupportPausePolicy.shiftWindowsJson` descreve janelas globais, mas nao representa recorrencia por atendente/time, vigencia, excecao ou snapshot diario auditavel.

## Dependencias
- satisfeitas: TASK-AT-363, TASK-AT-391 e TASK-AT-392.
- em aberto: replay historico PostgreSQL e modelo/workflow explicito de folga, ausencia e ajuste; dobra/extra usa `SupportExtraShiftSlot` e `SupportShiftOccurrence.kind`.

## Estado reconciliado em 2026-07-18
- O schema aditivo persiste regra, padrao, atribuicao, ocorrencia, oferta, extra e vinculo opcional da Pausa. Nao existe entidade de excecao cobrindo toda a taxonomia originalmente prevista, e o replay integral de migrations continua externo.

## Alvos explicitos
1. Schema Prisma e migracoes expand-only.
2. Constraints/indices por tenant, pessoa, data e vigencia.
3. Backfill/dry-run que preserve support pauses atuais.

## Fora de escopo
- Materializar dias ou criar UI.
- Remover `shiftWindowsJson` durante a fase expand.

## Checklist
1. Modelar template recorrente semanal com timezone e validFrom/validTo.
2. Modelar versao imutavel de regra e vinculo de publicacao.
3. Modelar escala efetiva diaria com um ou mais intervalos e provenance.
4. Modelar excecao tipada: folga, ausencia, ajuste, dobra e slot extra.
5. Impedir sobreposicoes e referencias cross-tenant por constraint/service.
6. Definir idempotency/materialization key para cada pessoa/data/versao.

## Acceptance Criteria
1. Migracao e rollback de aplicacao nao removem dado de Pausa ou membership.
2. Historico identifica qual base, regra e excecao produziram o dia efetivo.
3. Intervalos que cruzam meia-noite possuem data operacional deterministica.
4. Reaplicar migracao/backfill nao duplica escala efetiva.

## Validacao
- comandos/checks: migration tests SQLite/Postgres, dry-run, contagens/checksums e Prisma validate.
- revisao manual: turno normal, noturno, folga, dobra e duas versoes futuras.

## Riscos
- Modelar apenas hora local sem offset/timezone tornar DST irreproduzivel.

## Proximo passo provavel
TASK-AT-394

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: schema aditivo e sem rewrite de reservas existentes.
