# TASK-AT-132 - Fluxos de atendimento com construtor visual de decisoes

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-132-service-flow-visual-decision-builder.md

## Objetivo unico
Criar um construtor visual de etapas com ramificacoes sim/nao/manual, permitindo que Admin/Supervisor modele fluxogramas sem editar JSON ou texto tecnico.

## Escopo
1. Editor de etapas com ordem, tipo e condicoes.
2. Ramos `sim`, `nao`, `manual` e opcoes customizadas.
3. Visualizacao em fluxograma compacto.
4. Validacao para evitar etapa sem destino ou loop confuso.

## Acceptance Criteria
1. Gestor monta fluxo sem depender de dev.
2. Atendente entende os caminhos possiveis visualmente.
3. Fluxo invalido nao pode ser publicado.
