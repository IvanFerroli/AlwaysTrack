# TASK-AT-367 - Modelo de pausas, escala e capacidade SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-367-sac-pause-policy-coverage-model.md

## Modo
- mode: implementation

## Objetivo unico
Modelar agenda, tipos de pausa, janelas de trabalho, slots e capacidade minima por time SAC.

## Contexto minimo
A capacidade depende de quem esta escalado e disponivel em cada intervalo, nao apenas do total de usuarios ativos. Timezone e historico precisam ser deterministas.

## Dependencias
- satisfeitas: TASK-AT-363 e TASK-AT-364.
- em aberto: n/a.

## Alvos explicitos
1. Schema/migracao de politica, escala, slot e reserva de pausa.
2. Regras de calendario e timezone da organizacao/time.
3. Servico puro de calculo de cobertura e capacidade.

## Fora de escopo
- Folha de ponto ou workforce management completo.
- Reserva/troca pela Web.

## Checklist
1. Definir tipos, duracao, janela elegivel, antecedencia e limite por atendente.
2. Modelar escala efetiva por data/intervalo e ausencias que retiram capacidade.
3. Calcular `disponiveis - pausas simultaneas >= capacidadeMinima`.
4. Tratar limites inclusivos/exclusivos, virada do dia e timezone.
5. Preservar versao da politica usada por reserva historica.

## Acceptance Criteria
1. O mesmo conjunto de entradas produz o mesmo resultado de capacidade.
2. Usuario fora da escala ou membership vigente nao reserva slot.
3. Alterar politica futura nao muda a explicacao de reserva passada.
4. Intervalos invalidos, sobrepostos ou fora do tenant sao rejeitados.

## Validacao
- comandos/checks: testes unitarios de limites/timezone, migration test e typecheck API.
- revisao manual: simular time cheio, capacidade minima, ausencia e virada de data.

## Riscos
- Erro de borda permitir uma pausa a mais no mesmo minuto.

## Proximo passo provavel
TASK-AT-368

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: regra de capacidade independente da UI e testavel sem relogio real.
