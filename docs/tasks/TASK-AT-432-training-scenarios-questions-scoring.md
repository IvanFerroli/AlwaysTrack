# TASK-AT-432 - Cenários, questões, feedback e pontuação

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-432-training-scenarios-questions-scoring.md

## Modo
- mode: implementation
- priority: P0
- generation-mode: initiative-breakdown

## Capability
Training / Evaluation Authoring

## Origem documental
- `TASK-AT-428`, `TASK-AT-430` e `TASK-AT-431`.

## Problema
Fluxos descrevem caminhos, mas não definem por si só enunciado, alternativas corretas, rubrica, feedback, peso, aprovação ou tentativas de um simulado.

## Objetivo único
Permitir criar cenários/questões derivados de nós de FlowVersion e executar scoring determinístico para questões objetivas e decisões guiadas.

## Contexto mínimo
Questões devem referenciar versão/nó imutáveis e acrescentar semântica pedagógica sem modificar o Fluxo fonte.

## Inputs
- Models versionados da `TASK-AT-430`.
- Runtime assistido e grafo da `TASK-AT-431`.
- Política de score/tentativas aprovada no contrato.

## Escopo
1. Autoria de cenário com `flowVersionId`/`nodeKey` e snapshot.
2. Tipos `OBJECTIVE`, `GUIDED_DECISION` e `OPEN_TEXT`.
3. Alternativas, resposta esperada, peso, feedback correto/incorreto e ordem.
4. Cálculo de score, threshold, aprovação, tentativas e estados finais.
5. Open text salvo como formativo ou `PENDING_REVIEW`, sem auto-score/IA.
6. Preview/validação antes de publicar versão.

## Fora de escopo
- Correção humana/IA de resposta aberta.
- Banco randômico adaptativo e proctoring.
- Alterar grafo/step do Fluxo pela tela de questão.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — módulos futuros de cenários e scoring.
- `apps/web/src/views/` — view administrativa futura de Treinamento.
- `packages/shared/src/` — contratos futuros de Treinamento.

## Requisitos funcionais
1. Questão aponta para nó existente na FlowVersion ou conteúdo independente permitido.
2. Scoring usa somente configuração da versão pinada.
3. Feedback respeita policy imediata ou final definida na versão.
4. Tentativa acima do limite é bloqueada determinísticamente.
5. Open text não altera score automático sem rubrica/review posterior.

## Requisitos de permissão, tenant e auditoria
1. Somente `training.manage/publish` cria ou publica cenário/questão.
2. FlowVersion/nó e programa pertencem ao mesmo tenant.
3. Alterar resposta correta, peso, threshold ou feedback cria nova versão e auditoria.
4. Resposta aberta não aparece em log/notificação.

## Checklist de execução
1. Implementar contratos e validações de autoria.
2. Implementar preview e publicação imutável.
3. Implementar engine de score pura e determinística.
4. Integrar respostas ao attempt.
5. Cobrir feedback, limite e open text pendente/formativo.

## Critérios de aceite
1. Cenário derivado mantém lineage de FlowVersion/nó.
2. Objective/guided produzem score reproduzível e feedback correto.
3. Mudança futura não altera attempt/resultado existente.
4. Open text nunca recebe nota automática por default.

## Testes esperados
- Property/table tests de pesos, arredondamento, threshold e tentativas.
- Nó ausente, cross-tenant, versão arquivada e republicação.
- Preview/publicação e payloads inválidos.
- Web de autoria básica e `git diff --check`.

## Riscos
- Fórmula ambígua gerar resultados não reproduzíveis.
- Feedback imediato expor gabarito quando política pedir resultado final.

## Dependências
- satisfeitas: FlowVersion/nodes imutáveis e input validation.
- em aberto: `TASK-AT-430`/`431`; decisões de threshold, tentativas e timing do feedback.

## Blockers possíveis
- Política pedagógica de score/tentativas não aprovada.
- Open text exigido como avaliativo antes da `TASK-AT-438`.

## Definição de pronto
1. Autoria, validação, publicação e scoring determinístico entregues.
2. Testes cobrem boundary cases e lineage.
3. Limites e política de feedback constam na versão publicada.

## Evidência esperada
- Golden cases de score e tentativa.
- Exemplo de cenário derivado com snapshot/lineage.

## Próximo passo provável
`TASK-AT-433`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar somente autoria/scoring determinístico.
- constraints: sem IA e sem correção manual implícita.
