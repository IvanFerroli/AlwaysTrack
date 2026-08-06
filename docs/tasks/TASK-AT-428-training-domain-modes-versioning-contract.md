# TASK-AT-428 - Contrato de modos, versões e métricas de Treinamento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-428-training-domain-modes-versioning-contract.md

## Modo
- mode: planning
- priority: P0
- generation-mode: initiative-breakdown

## Capability
Training / Architecture

## Origem documental
- Solicitação de expansão do AlwaysTrack em 2026-08-05.
- `docs/tasks/INTERNAL-COMMUNICATION-TRAINING-BACKLOG-2026-08-05.md`.
- `TASK-AT-244`, `TASK-AT-249` e `TASK-AT-136`.

## Problema
Fluxos já possuem versão, sessão e métricas operacionais. Reutilizar essa persistência para treino faria exercícios parecerem atendimentos reais e permitiria que conteúdo vivo alterasse tentativas e resultados históricos.

## Objetivo único
Formalizar o bounded context de Treinamento, os três modos de execução e a estratégia de snapshot/pinning e isolamento métrico antes de schema ou runtime.

## Contexto mínimo
O contrato deve preservar Fluxos como fonte operacional sem transformá-los em LMS genérico nem duplicar seu editor/grafo.

## Inputs
- Models e services atuais de `ServiceFlowVersion`, `ServiceFlowSession` e analytics.
- Domínios Wiki, FAQ, Scriptoteca, Avisos, usuários, roles, equipes e notificações.
- Decisões humanas listadas no backlog da iniciativa.

## Escopo
1. Definir `OPERATIONAL`, `ASSISTED_TRAINING` e `EVALUATIVE_SIMULATION`.
2. Definir `TrainingProgram`/versão como orquestrador de onboarding, conteúdo e simulado.
3. Definir quando snapshots são gerados e como tentativas ficam pinadas.
4. Separar tabelas, eventos, endpoints, métricas e dashboards operacionais/de treino.
5. Definir feedback, score, aprovação, tentativas, validade e estados de publicação.
6. Registrar matriz MVP/fase 2.

## Fora de escopo
- Alterar runtime, schema ou métricas existentes.
- Definir fórmula final sem decisão de produto.
- Implementar IA avaliadora ou certificação externa.

## Arquivos ou domínios candidatos
- `docs/adr/` — ADR futuro de snapshot e isolamento.
- `docs/specs/` — spec futura de Treinamento.
- `docs/architecture/domains.md`.
- ServiceFlow, Training, Knowledge, Notifications e Audit.

## Requisitos funcionais
1. Treino assistido orienta e dá feedback sem produzir nota operacional.
2. Simulado avaliativo calcula resultado conforme versão publicada.
3. Tentativa aberta continua na versão iniciada após republicação.
4. Nova atribuição usa versão nova somente por ação explícita.
5. Conteúdo referenciado permanece reprodutível após alterações nos domínios fonte.

## Requisitos de permissão, tenant e auditoria
1. Todo agregado e snapshot pertence à organização.
2. Resultado nominal segue escopo self/team/org a definir na matriz da `TASK-AT-429`.
3. Publicação, atribuição, reset/override e revisão são auditáveis.
4. Resposta aberta e dados de cenário não entram em metadata genérica.

## Checklist de execução
1. Mapear escrita/leitura/analytics dos Fluxos atuais.
2. Desenhar agregados e fluxos de estado dos três modos.
3. Fixar estratégia de snapshot, pinning e upgrade.
4. Registrar invariantes de isolamento e decisões humanas abertas.
5. Derivar contratos consumidos pelas tasks seguintes.

## Critérios de aceite
1. ADR/spec proíbem treino em `ServiceFlowSession` e métricas operacionais.
2. Cada referência possui política de snapshot, lineage e indisponibilidade.
3. Modos são distinguíveis por UI, API, persistência e analytics.
4. Score/tentativa/feedback em aberto possuem owner e não viram default oculto.

## Testes esperados
- `npm run check:docs` e `git diff --check`.
- Revisão manual contra schema, service-flow services, metrics e task `AT-357` pendente.
- Matriz de cenários: republicação durante tentativa, recurso arquivado e reassignment.

## Riscos
- Versionar apenas IDs e ainda renderizar conteúdo vivo.
- Criar segundo editor de Fluxos dentro de Treinamento.

## Dependências
- satisfeitas: versão imutável de Fluxos e sessão operacional pinada já existem.
- em aberto: decisões humanas de score, tentativas, recertificação e visibilidade nominal.

## Blockers possíveis
- Ausência de aprovação do contrato de snapshot e isolamento.
- Tentativa de resolver política pedagógica apenas por inferência técnica.

## Definição de pronto
1. ADR/spec aceitos e citados pelas tasks `AT-429` a `AT-439`.
2. Diagrama mostra separação de persistência/eventos/métricas.
3. Perguntas abertas e defaults temporários estão explícitos.

## Evidência esperada
- Matriz modo -> storage -> eventos -> métricas -> UI.
- Diagrama de snapshot/lineage e cenários de republicação.

## Próximo passo provável
`TASK-AT-429`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: concluir contrato documental antes de schema ou runtime.
- constraints: sem código; sem gravar treino em entidades operacionais.
