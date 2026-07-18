# TASK-AT-391 - Contrato canonico de Escalas e frentes associadas

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-391-sac-scheduling-cross-cutting-contract.md

## Modo
- mode: planning

## Objetivo unico
Fixar fronteiras, invariantes e mapa de compatibilidade para Escalas, Pausas, Notificacoes, overlays e Avisos recorrentes antes de novas migracoes.

## Contexto minimo
A politica atual de Pausas guarda janelas de turno em JSON e calcula capacidade por memberships ativos. Escala efetiva diaria exige fonte de verdade propria e nao pode ser apenas outro campo da pausa.

## Dependencias
- satisfeitas: baseline documental TASK-AT-363, TASK-AT-367 a TASK-AT-372 e TASK-AT-383 a TASK-AT-390.
- em aberto: reconciliar o status real de implementacao dessas baselines antes da execucao.

## Alvos explicitos
1. ADR/delta de dominio e diagrama de fontes de verdade.
2. Matriz modelo/rota/view/job/evento: manter, estender, migrar ou aposentar.
3. Contratos de timezone, versionamento, idempotencia e rollback.

## Fora de escopo
- Alterar runtime ou schema.
- Resolver politica trabalhista por inferencia tecnica.

## Checklist
1. Definir turno-base, escala efetiva, excecao, dobra, slot extra, oferta, troca e aprovacao.
2. Definir precedencia deterministica entre base, regra versionada e excecoes.
3. Definir como mudanca de escala invalida ou remarca pausa existente.
4. Definir alvo tipado/fallback de notificacao e ocorrencia de Aviso.
5. Definir staleness maximo e fonte do painel de cobertura.

## Acceptance Criteria
1. Cada conceito possui owner, fonte de verdade, chave temporal e estrategia de historico.
2. `shiftWindowsJson` deixa de ser fonte autonoma de elegibilidade quando Escalas estiver habilitado.
3. Nenhuma remarcacao, recorrencia ou deep link depende de comportamento silencioso.
4. Lacunas de produto bloqueantes ficam registradas com owner e prazo.

## Validacao
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisao manual: cruzar schema, support-operations, notifications, announcements, Web e jobs.

## Riscos
- Criar duas definicoes concorrentes de turno e cobertura.

## Proximo passo provavel
TASK-AT-392

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: aprovar o contrato antes de qualquer migracao.
