# TASK-RTM-003 - Budget e limites operacionais do ciclo IA

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-RTM-003-budget-e-limites-do-ciclo-ia.md

## Modo
- mode: runtime

## Objetivo unico
Adicionar guardrails de budget, timeout e volume ao ciclo unificado (`/v1/pipeline/run`) para manter custo e latencia sob controle sem perder utilidade operacional.

## Contexto minimo
A task RTM-002 consolidou o ciclo unico, mas a memoria aponta dependencia aberta de policy de budget/limite por rodada IA.

## Inputs
- `services/api/src/features/pipeline/pipeline.service.ts`
- `services/api/src/features/match/match.service.ts`
- `services/api/src/core/llm/gemini.ts`
- `packages/shared-types/src/index.ts`
- `docs/tasks/TASK-RTM-002-ciclo-agentico-de-coleta-e-triagem.md`

## Dependencias
- satisfeitas: TASK-RTM-002, TASK-MCH-003
- em aberto: policy de budget canonica (a consolidar nesta task)

## Alvos explicitos
1. Definir contrato de limite por rodada (ex.: `maxLlmJobs`, `maxDurationMs`, `maxSources`, `maxEstimatedCostUsd`).
2. Aplicar limites no runtime do pipeline com comportamento degradado previsivel (warn + continuar quando seguro).
3. Expor no payload final consumo da rodada e cortes aplicados por budget.
4. Persistir decisao de corte/limitacao em `decision-logs` e `skill-executions`.

## Fora de escopo
- mudar provedor LLM;
- otimizar prompt engineering profunda;
- billing real externo.

## Checklist
1. Introduzir config/env para limites de rodada com defaults conservadores.
2. Garantir que limite estourado nao derruba ciclo completo.
3. Incluir testes cobrindo limite de custo e limite de duracao.
4. Atualizar docs de endpoint com semantica de degradacao.

## Acceptance Criteria
1. Pipeline respeita limites configurados por rodada.
2. Resposta informa claramente quando houve corte por budget/timeout.
3. Logs de observabilidade deixam trilha do motivo de limitacao.

## Definition of Done
1. Guardrails ativos no endpoint unificado.
2. Testes automatizados cobrindo cenarios de limite.

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run test --workspace @olympus/api -- src/features/pipeline/pipeline.service.test.ts`
- revisao manual:
  - executar `/v1/pipeline/run` com limites baixos e validar `warnings` + logs.

## Evidencia esperada
- payload com campos de budget aplicado;
- logs de corte por limite em `decision-logs`;
- testes verdes para cenarios de limitacao.

## Riscos
- limites agressivos reduzirem demais utilidade da shortlist;
- limites frouxos manterem custo imprevisivel.

## Blockers possiveis
- falta de baseline de custo real por chamada LLM;
- timeout de fontes externas mascarar causa de degradacao.

## Feedback obrigatorio de retorno
- quais defaults de budget foram adotados e por que?
- qual impacto observado em tempo total e qualidade da shortlist?
