# TASK-PRD-007 - Expansão de Filtros e Tags Customizadas

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-25

## Modo
- mode: planning

## Objetivo unico
Ampliar a capacidade de filtros da UI/API (País e Plataforma), corrigir a limitação de exibição na tela e implementar um sistema de input/remoção de tags customizadas.

## Contexto minimo
O usuário relatou que filtros vazios "não trazem todas as vagas". Isso ocorreu pois a interface limitava visualmente um `slice(0, 30)`. Vamos remover o limite (renderizar todas ou até 500). Adicionalmente, as queries `location` e `sourceName` devem integrar o motor do `MatchService` e do Dashboard. Por fim, as vagas devem ter um mini-input para o usuário digitar tags livres e removê-las ao clicar.

## Alvos explicitos
1. Remover o `slice(0, 30)` do `render-dashboard.ts` (ou aumentar para 500).
2. Adicionar `location` e `sourceName` no `JobFilterOptions` e aplicá-los na lista.
3. Adicionar selects/inputs na UI para Country/Location e Source.
4. Adicionar um micro-sistema na UI (dentro do job card) para inserir `nova tag` via JS e fazer fetch pro endpoint.
5. Criar no endpoint update lógica de `addTag` e `removeTag` de forma atômica no Store.

## Definition of Done
- Interface mostrando mais vagas.
- Filtros de localização e fonte funcionando.
- Usuário capaz de inserir texto e pressionar Add Tag, ou clicar em um [x] da tag para remover.
