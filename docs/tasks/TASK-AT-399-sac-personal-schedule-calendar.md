# TASK-AT-399 - Calendario pessoal de Escalas SAC

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-399-sac-personal-schedule-calendar.md

## Modo
- mode: implementation

## Objetivo unico
Exibir ao atendente sua escala efetiva, excecoes, Pausas e negociacoes em calendario/lista acessiveis.

## Contexto minimo
O calendario pessoal precisa mostrar o que vale de fato, distinguindo turno-base, alteracao aprovada, trabalho extra, Pausa e pedido pendente sem expor escala nominal de terceiros.

## Dependencias
- satisfeitas: TASK-AT-395, TASK-AT-396 e TASK-AT-397.
- em aberto: n/a.

## Alvos explicitos
1. API self-scoped por intervalo e timezone.
2. View mensal/semanal/lista com detalhe do dia.
3. Deep links para excecao, oferta, troca e remarcacao de Pausa.

## Fora de escopo
- Editar turno por drag-and-drop.
- Exportar dados pessoais de colegas.

## Checklist
1. Combinar escala efetiva, excecoes, intervalos adicionais e Pausas.
2. Mostrar status/provenance sem sobrecarregar o calendario.
3. Tratar dias cruzando meia-noite e timezone da regra.
4. Oferecer lista equivalente e navegacao por teclado.
5. Exibir conflito/acao pendente com CTA para entidade correta.

## Acceptance Criteria
1. Calendario reconcilia com snapshot efetivo e Pausas do mesmo periodo.
2. SAC nao consulta calendario nominal de outro usuario por ID manual.
3. Cor, legenda e texto distinguem turno, dobra, slot extra, Pausa e pendencia.
4. Mobile, zoom e leitor de tela possuem alternativa funcional.

## Validacao
- comandos/checks: testes service/HTTP/componentes, acessibilidade, timezone e screenshots.
- revisao manual: semana normal, excecao, dobra, Pausa e troca pendente.

## Riscos
- Calendario visual ocultar intervalo curto ou sobreposto sem alternativa tabular.

## Proximo passo provavel
TASK-AT-400

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: UI somente leitura da fonte efetiva, com acoes explicitas separadas.
