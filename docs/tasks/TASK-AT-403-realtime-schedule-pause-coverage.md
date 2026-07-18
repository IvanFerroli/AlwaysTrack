# TASK-AT-403 - Cobertura em tempo real de Escalas e Pausas

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-403-realtime-schedule-pause-coverage.md

## Modo
- mode: implementation

## Objetivo unico
Expor e atualizar a cobertura operacional calculada por escala efetiva, Pausas, ausencias, extras e negociacoes efetivadas.

## Contexto minimo
TASK-AT-372 mostra overlap de Pausas. A nova leitura precisa incluir quem realmente esta escalado em cada instante e possuir freshness mensuravel para decisao gerencial.

## Dependencias
- satisfeitas: TASK-AT-372, TASK-AT-400, TASK-AT-401 e TASK-AT-402.
- em aberto: transporte e SLO de staleness definidos na TASK-AT-391.

## Alvos explicitos
1. Read model/timeline de cobertura por time e intervalo.
2. Atualizacao push ou polling bounded com cursor/version.
3. Integracao no painel gerencial e grafico de overlap.

## Fora de escopo
- Presenca real inferida de teclado/login.
- Chamar polling sem SLO de tempo real.

## Checklist
1. Calcular escalados, ausentes, em trabalho extra, em Pausa e disponiveis.
2. Publicar versao monotona/updatedAt para invalidacao de cache.
3. Atualizar apos escala, excecao, troca, booking, remarcacao e override.
4. Reconciliar eventos perdidos com snapshot canonico.
5. Destacar stale/degradado em vez de mostrar numero antigo como atual.

## Acceptance Criteria
1. Cobertura reflete mutacoes dentro do SLO acordado e reconcilia com snapshot.
2. Evento duplicado/fora de ordem nao altera total incorretamente.
3. Falha do transporte degrada para refresh seguro e sinaliza staleness.
4. Tenant/time e dados nominais respeitam RBAC em stream e snapshot.

## Validacao
- comandos/checks: testes read model/eventos, reconnect, ordem/duplicidade, carga e E2E multiaba.
- revisao manual: aprovar excecao, reservar/remarcar Pausa e observar timeline.

## Riscos
- Stream sem autorizacao por assinatura vazar atualizacoes de outro time.

## Proximo passo provavel
TASK-AT-404

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: tempo real definido por SLO, nao por label de produto.

