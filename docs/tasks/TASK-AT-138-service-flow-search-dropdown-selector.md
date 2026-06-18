# TASK-AT-138 - Seletor de fluxo por busca e dropdown

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-138-service-flow-search-dropdown-selector.md

## Objetivo unico
Substituir a lista de botoes de Fluxos de Atendimento por uma caixa de pesquisa com dropdown, deixando a escolha do tipo de atendimento mais compacta e escalavel.

## Contexto
Com mais fluxos cadastrados, a lista lateral de botoes fica longa e visualmente pesada. A jornada ideal e o atendente buscar pelo tipo de atendimento e escolher no dropdown.

## Escopo funcional
1. Criar busca local sobre titulo, resumo e tags dos fluxos carregados.
2. Trocar lista de botoes por dropdown filtrado.
3. Manter resumo do fluxo selecionado.
4. Preservar abertura da primeira etapa ao trocar de fluxo.

## Acceptance Criteria
1. Selecionar fluxo nao depende de varios botoes empilhados.
2. Busca e dropdown funcionam juntos.
3. Troca de fluxo limpa sessao ativa e prepara scripts pessoais para o fluxo escolhido.

## Resultado
- Entregue em `EXEC-AT-138`.

## Riscos
- Quando houver centenas de fluxos, a busca deve virar server-side; MVP local atende o volume atual.
