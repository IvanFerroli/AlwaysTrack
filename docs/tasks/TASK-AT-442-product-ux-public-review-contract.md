# TASK-AT-442 - Contrato publico de review Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-442-product-ux-public-review-contract.md

## Modo
- mode: contracts
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Public Contract

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR/spec de `TASK-AT-440`.
- Scaffold de `TASK-AT-441`.
- Template `olympus-contracts-builder/templates/skill-contract.template.md`.

## Objetivo unico
Formalizar o contrato de entrada, saida, severidade, evidencia e handoff dos modos `audit`, `interaction-spec` e `advisory-review`.

## Contexto minimo
Sem shape explicito, o especialista pode receber pedidos vagos, emitir opiniao estetica como fato ou produzir saida que Taskyfier, Runtime e Quality nao conseguem consumir de forma deterministica.

## Inputs
- Jornada/superficie, objetivo do usuario e roles envolvidas.
- Regras de produto aceitas e constraints do escopo.
- Evidencia disponivel com proveniencia.
- Contratos de handoff dos kits Olympus.

## Dependencias
- satisfeitas: template de contrato de skill e boundaries Olympus existentes.
- em aberto: `TASK-AT-440` e `TASK-AT-441`.

## Alvos explicitos
1. `.agents/skills/olympus-product-ux/contracts/ux-review-contract.md`.
2. Shapes documentais de `UxReviewRequest`, `UxFinding`, `InteractionSpec` e `AdvisoryReview` ou equivalentes.
3. Taxonomia de severidade, confianca, evidencia ausente e decisao humana.

## Fora de escopo
- Implementar parser, handler ou schema runtime.
- Criar task, ADR, spec canonica ou decisao de produto automaticamente.
- Definir o contrato de captura visual, tratado em `TASK-AT-443`.

## Checklist de execucao
1. Definir campos obrigatorios por modo e validacoes de entrada.
2. Separar observacao, inferencia, preferencia e decisao humana.
3. Exigir evidencia, impacto, severidade, confianca e superficie afetada por finding.
4. Modelar estados loading, empty, error, success, disabled e permission-denied na interaction spec quando aplicavel.
5. Incluir responsive, teclado, foco, semantica, copy e privacidade.
6. Definir consumidores permitidos e outputs que nao podem ser emitidos.

## Acceptance Criteria
1. Pedido sem jornada, objetivo ou evidencia minima falha com motivo acionavel.
2. Finding distingue fato observado de recomendacao e gosto subjetivo.
3. Interaction spec e consumivel por Taskyfier, Runtime e Quality sem redefinir arquitetura.
4. Advisory review nunca se apresenta como aceite do Task Verifier.

## Definition of Done
1. Contrato publico completo e versionado no skill package.
2. Boundary de callers/consumers/dependencias permitidas e proibidas explicita.
3. Exemplos valido, invalido e ambiguo incluidos sem dado sensivel.

## Validacao
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisao manual: simular consumo pelo Taskyfier, Runtime Builder, Quality Builder e Task Verifier.

## Evidencia esperada
- Contrato material com shapes, garantias, erros e fallback.
- Matriz modo -> input -> output -> consumidor.

## Riscos
- Contrato amplo demais autorizar redesign, arquitetura ou aceite paralelo.
- Taxonomia subjetiva produzir severidades inconsistentes.

## Blockers possiveis
- Fronteiras de `TASK-AT-440` ainda nao aceitas.
- Divergencia sobre qual kit consome cada output.

## Proximo passo provavel
`TASK-AT-443`

## Feedback obrigatorio de retorno
- contrato materializado
- ambiguidades eliminadas
- exemplos cobertos
- ressalvas para aquisicao visual

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Contracts Builder e fechar apenas o contrato publico de review.
- constraints: sem harness, skill final, agente, routing, task automatica ou aceite final.
