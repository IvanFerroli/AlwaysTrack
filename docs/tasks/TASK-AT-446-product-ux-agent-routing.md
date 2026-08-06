# TASK-AT-446 - Agente Product UX e roteamento Olympus

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-446-product-ux-agent-routing.md

## Modo
- mode: runtime
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Agent Runtime and Routing

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR/spec de `TASK-AT-440`.
- Skill package concluido em `TASK-AT-445`.
- Protocolos Codex, Antigravity e Orchestrator atuais.

## Objetivo unico
Materializar o agente Product UX e torna-lo roteavel pela malha Olympus sem alterar ownership ou comportamento dos agentes existentes.

## Contexto minimo
Um skill package isolado nao participa do pipeline. O agente precisa de identidade estreita, ativacao consistente entre engines e handoff explicito; adicionar routing sem contratos/evals criaria um especialista generico dificil de governar.

## Inputs
- TOMLs, bundles e registry atuais.
- Contratos e limites do skill package.
- Routing rubric e modos oficiais do Orchestrator.
- Politica de ativacao e aliases Antigravity.

## Dependencias
- satisfeitas: malha Codex/Antigravity e Orchestrator em operacao.
- em aberto: `TASK-AT-440` a `TASK-AT-445`.

## Alvos explicitos
1. `.codex/agents/olympus_product_ux.toml`.
2. `.antigravity/agents/ux.md` ou alias canonico aceito.
3. `.antigravity/registry.md` e referencias estritamente necessarias.
4. Skill/manifest/rubrica de routing do Orchestrator.
5. Handoffs de Taskyfier, Runtime, Quality e Verifier apenas quando contratualmente necessarios.

## Fora de escopo
- Implementar UI, testes de produto ou harness.
- Mudar prompts ou ownership de agentes nao relacionados.
- Permitir que Product UX crie task, implemente ou aprove entrega.
- Extrair plugin externo.

## Checklist de execucao
1. Criar identidade e system prompt estritos, referenciando o SKILL como fonte operacional.
2. Criar bundle Antigravity equivalente sem divergencia de comportamento.
3. Registrar alias e ativacao nas superficies vigentes.
4. Adicionar modo/handoff `ux` ao Orchestrator com criterio de roteabilidade.
5. Definir quando a task volta ao Taskyfier por falta de referencia, contrato ou evidencia.
6. Preservar os modos documental, scaffolding, contracts, runtime, quality e ops.
7. Validar que Product UX nao pode fechar aceite nem editar produto por impulso.

## Acceptance Criteria
1. O mesmo pedido valido ativa responsabilidade equivalente em Codex e Antigravity.
2. Orchestrator roteia task UX somente quando jornada, objetivo, evidencia e output esperado estao definidos.
3. Pedido de implementacao continua destinado ao Runtime Builder; pedido de teste continua no Quality Builder.
4. Falta de referencia/evidencia retorna blocker tipado ao Taskyfier.
5. Nenhum agente existente perde capacidade ou recebe prompt reescrito fora do necessario.

## Definition of Done
1. Agente, bundle, registry e routing materiais e coerentes.
2. Smoke de ativacao/handoff positivo e negativo executado.
3. Integridade, higiene e diff aprovados.

## Validacao
- comandos/checks: checks de registry/protocolo, dry-runs de roteamento, `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: audit, interaction-spec, implementacao UI, teste visual e aceite final devem rotear para owners distintos.

## Evidencia esperada
- Arquivos de agente/bundle/routing alterados.
- Matriz pedido -> especialista -> modo -> blocker/fallback.

## Riscos
- Adicionar modo UX e criar rota paralela para implementation/quality.
- Codex e Antigravity divergirem em limites ou formato de saida.

## Blockers possiveis
- Skill package nao aprovado.
- Registry/protocolo Olympus mudar antes da execucao.

## Proximo passo provavel
`TASK-AT-447`

## Feedback obrigatorio de retorno
- agente e aliases materializados
- routing alterado
- dry-runs e evidencias
- compatibilidade preservada

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Runtime Builder e conectar somente superfices ja contratadas.
- constraints: sem feature de produto, teste/eval amplo, redesign, ownership novo ou extracao externa.
