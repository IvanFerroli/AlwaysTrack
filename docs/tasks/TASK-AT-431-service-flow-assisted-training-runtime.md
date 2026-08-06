# TASK-AT-431 - Runtime assistido de Fluxo em Treinamento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-431-service-flow-assisted-training-runtime.md

## Modo
- mode: implementation
- priority: P0
- generation-mode: initiative-breakdown

## Capability
Training / Assisted Runtime

## Origem documental
- `TASK-AT-244`, `TASK-AT-245`, `TASK-AT-249`, `TASK-AT-352` a `TASK-AT-357` e `TASK-AT-430`.

## Problema
O usuário precisa percorrer um Fluxo para aprender, pausar e retomar, mas chamar os services de sessão operacional gravaria eventos e métricas de atendimento real.

## Objetivo único
Executar uma `ServiceFlowVersion` em modo assistido usando `TrainingAttempt` própria e helpers puros do grafo, sem qualquer escrita operacional.

## Contexto mínimo
O runtime deve reutilizar estrutura, validação e regras determinísticas do Fluxo, não handlers/tabelas/analytics de atendimento.

## Inputs
- Persistência da `TASK-AT-430`.
- Grafo versionado, nodes/transitions e validação existentes.
- Regras de progresso/retomada definidas no contrato.

## Escopo
1. Iniciar/retomar attempt assistido pinado a FlowVersion.
2. Materializar passos de treino a partir do snapshot/grafo.
3. Registrar decisões e progresso com feedback explicativo.
4. Permitir voltar/reconfirmar sem apagar histórico.
5. Concluir/cancelar attempt e emitir eventos exclusivos de treino.
6. Expor API sem rotas compartilhadas com sessão operacional.

## Fora de escopo
- Score/aprovação, questões avulsas e assignment de trilha.
- Executar conectores, enviar mensagens ou alterar `ServiceCase`.
- Escrever `ServiceFlowSession`, search events ou operational script events.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — runtime futuro de Treinamento.
- `packages/shared/src/` — helper puro futuro do runtime de treino.
- Helpers puros extraídos de `services/api/src/core/service-flows/` somente se necessário.
- `docs/api/openapi.v1.yaml`.

## Requisitos funcionais
1. Start identifica FlowVersion/snapshot e primeiro nó determinístico.
2. Decisão válida avança somente pelas transições permitidas.
3. Feedback assistido explica a escolha sem atribuir score avaliativo.
4. Retomada restaura o mesmo grafo/conteúdo e passo corrente.
5. Conclusão de treino não aparece como atendimento concluído.

## Requisitos de permissão, tenant e auditoria
1. Usuário executa apenas enrollment/programa publicado permitido.
2. FlowVersion e attempt devem pertencer ao mesmo tenant.
3. Auditoria registra lifecycle/IDs/status, não dados livres do cenário.
4. Capabilities operacionais/conectores ficam proibidas no runtime de treino.

## Checklist de execução
1. Identificar helpers puros reutilizáveis e fronteiras com side effects.
2. Implementar service/handlers exclusivos de treino.
3. Cobrir start, advance, rewind, resume, complete e cancel.
4. Instrumentar métricas próprias.
5. Provar zero writes em entidades operacionais.

## Critérios de aceite
1. Usuário conclui e retoma Fluxo assistido sem criar `ServiceFlowSession`.
2. Republicação durante attempt não muda nós, instruções ou decisões.
3. Nenhum conector/capability externa é executado.
4. Metrics de `TASK-AT-136` permanecem idênticas antes/depois do treino.

## Testes esperados
- Grafo linear, decisão, loop permitido, rewind e retomada.
- Republicação concorrente e snapshot antigo.
- Spy/assert de ausência de writes/events operacionais.
- Anti-IDOR, input validation, HTTP contract e `git diff --check`.

## Riscos
- Helper extraído continuar acoplado a audit/metrics operacionais.
- Feedback assistido revelar resposta de simulado avaliativo futuro.

## Dependências
- satisfeitas: grafo e versionamento imutável de Fluxos.
- em aberto: `TASK-AT-430`; decisão de feedback assistido.

## Blockers possíveis
- Grafo atual não possuir fronteira pura reutilizável.
- `TASK-AT-357` pendente gerar expectativa incorreta de reuso de UI operacional.

## Definição de pronto
1. API/runtime assistido completo em persistência própria.
2. Testes provam pinning, retomada e zero contaminação.
3. Contratos e limitações documentados.

## Evidência esperada
- Teste comparativo de contadores operacionais antes/depois.
- Roteiro sanitizado de attempt assistido retomável.

## Próximo passo provável
`TASK-AT-432`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: reutilizar somente contratos puros do Flow.
- constraints: sem `ServiceFlowSession`, conectores ou métricas operacionais.
