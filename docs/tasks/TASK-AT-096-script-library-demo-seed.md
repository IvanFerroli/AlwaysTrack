# TASK-AT-096 - Scriptoteca: seeds e demo com scripts reais

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-096-script-library-demo-seed.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.8
- dependencias: `TASK-AT-089`, `TASK-AT-090`

## Objetivo unico
Adicionar dados demo previsiveis para apresentar a Scriptoteca com categorias reais de SAC.

## Escopo funcional
1. Categorias como pedido atrasado, produto avariado, estorno, logistica reversa, acareacao e encerramento.
2. Scripts validados e rascunhos.
3. Pelo menos um script obsoleto para demonstrar governanca.
4. Tags e canais variados.
5. Roteiro curto de demo.

## Acceptance Criteria
1. Reset demo cria categorias/scripts.
2. Demo mostra encontrar por categoria, buscar e copiar.
3. Scripts nao usam dados sensiveis reais.
4. Estado demo e previsivel.
5. Documentacao inclui caminho de apresentacao.

## Riscos
- Usar texto real com dados sensiveis.
- Seed ficar pesado demais para ambiente local.

## Execucao parcial
- Seed local ja cria categorias e scripts validados de entrega/rastreio, financeiro/estorno e produto/duvida.
- Proxima rodada pode trocar ou ampliar os textos com exemplos reais anonimizados do SAC.
