# TASK-AT-352 - Progressao e foco deterministico no executor de Fluxos

## Metadata
- status: in-progress
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-352-service-flow-step-progression-focus.md

## Objetivo unico
Fazer cada conclusao de etapa fechar o bloco atual, abrir o proximo passo materializado e posiciona-lo no viewport, inclusive em fluxos com muitas decisoes.

## Escopo
- Aplicar o mesmo comportamento a conclusao manual, escolha de decisao e reconfirmacao.
- Resolver o proximo passo pela resposta persistida da sessao, sem supor ordem linear em grafos ramificados.
- Manter a etapa atual aberta e os dados locais intactos quando a API falhar.
- Preservar navegacao por teclado, foco visivel e reduced motion.

## Acceptance Criteria
1. Uma conclusao bem-sucedida recolhe a etapa concluida.
2. O proximo passo pendente ou em reconfirmacao abre e recebe foco/scroll.
3. Decisoes ramificadas levam ao destino realmente materializado pela API.
4. Falha de persistencia nao desloca o atendente nem apaga decisao ou nota.
5. Testes cobrem conclusao manual, decisao e erro.

## Dependencias
- TASK-AT-133
- TASK-AT-350
