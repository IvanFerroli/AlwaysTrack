# TASK-UX-001 - Dashboard filters and collapsible sections

## Metadata
- id: TASK-UX-001
- titulo: Ajustar dashboard para filtros multi-select, keyword efetiva e menos ruido visual
- capability: dashboard-ux
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-25
- source-of-truth: code + local gates + user feedback

## Objetivo unico
Melhorar a usabilidade do Dashboard para navegar vagas reais sem ruido excessivo, com filtros aplicaveis ao batch atual e scraper keyword mais previsivel.

## Escopo implementado
- Vagas por afinidade foram movidas para logo abaixo de quick actions.
- Centro de controle, vagas, overview e rotas passaram a ser secoes colapsaveis.
- Overview e rotas ficam recolhidos por padrao.
- Filtros de busca, local, fonte e status viraram multi-select.
- Opcoes dos filtros sao derivadas das vagas carregadas no batch atual.
- Busca multi-select aplica AND entre termos.
- Local, fonte e status multi-select aplicam OR dentro da categoria.
- Keyword do scraper agora tambem faz pos-filtro local antes de ingerir/persistir.
- Termos de senioridade como `junior` precisam aparecer no titulo para evitar capturar vaga senior por mencao na descricao.

## Fora de escopo
- Autocomplete avancado com componente JS dedicado.
- Paginacao/virtualizacao de lista.
- Persistencia de preferencias de filtro por usuario.

## Evidencia
- `npm run typecheck` passou.
- `npm run lint` passou.
- `npm test --workspace @olympus/api` passou com 56 testes.
- Testes novos cobrem multi-select filters e pos-filtro de keyword `junior`.

## Riscos remanescentes
- Multi-select HTML nativo exige Ctrl/Cmd para selecionar varias opcoes em desktop.
- Busca por termos usa tokens do batch e pode exigir refinamento posterior para UX mais amigavel.

## Proximo passo recomendado
Adicionar um componente de selecao com chips/remover opcao se o multi-select nativo ficar desconfortavel no uso real.
