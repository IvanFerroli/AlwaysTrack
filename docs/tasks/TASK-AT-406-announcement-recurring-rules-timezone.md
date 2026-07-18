# TASK-AT-406 - Regras recorrentes, timezone e vigencia de Avisos

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-406-announcement-recurring-rules-timezone.md

## Modo
- mode: migration

## Objetivo unico
Modelar regra recorrente versionada e ocorrencia de Aviso sem alterar comunicados publicados existentes.

## Contexto minimo
Announcement atual possui uma unica janela `startsAt`/`expiresAt`. Recorrencia mensal nos dias 14 e 29 precisa separar template/regra da ocorrencia publicavel e de seus recibos.

## Dependencias
- satisfeitas: TASK-AT-082, TASK-AT-098, TASK-AT-359, TASK-AT-391 e TASK-AT-392.
- em aberto: comportamento do dia 29 em fevereiro nao bissexto.

## Alvos explicitos
1. Schema/migracao aditiva de regra, versao e ocorrencia.
2. Parser de recorrencia limitada e timezone IANA.
3. Compatibilidade com Announcement unitario e receipts existentes.

## Fora de escopo
- RRULE arbitraria sem UI/validacao.
- Reusar um receipt entre ocorrencias diferentes.

## Checklist
1. Suportar unitario e mensal por dias do mes, incluindo 14 e 29.
2. Definir hora local, timezone, validFrom/validTo e duracao/vigencia da ocorrencia.
3. Versionar conteudo, audiencia, prioridade e requerimento de ciencia.
4. Criar chave unica regra/versao/data-local para idempotencia.
5. Vincular cada ocorrencia a Announcement/receipt/notificacao proprios.

## Acceptance Criteria
1. Avisos atuais continuam unitarios e sem backfill semantico indevido.
2. Regra 14/29 gera datas conforme politica documentada e timezone.
3. Cada ocorrencia possui vigencia e ciencia independentes.
4. Versao futura nao altera ocorrencia materializada/publicada.

## Validacao
- comandos/checks: migration, parser/property tests, timezone/DST e compatibilidade de Avisos atuais.
- revisao manual: meses de 28, 29, 30 e 31 dias em dois timezones.

## Riscos
- Usar UTC como calendario deslocar a ocorrencia para o dia anterior/seguinte.

## Proximo passo provavel
TASK-AT-407

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: fechar semantica de fevereiro antes do parser definitivo.

