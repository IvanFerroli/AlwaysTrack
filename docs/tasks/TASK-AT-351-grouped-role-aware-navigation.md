# TASK-AT-351 - Navegacao agrupada por dominio e perfil

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-351-grouped-role-aware-navigation.md

## Objetivo unico
Reduzir a navegacao lateral plana para seis entradas principais escaneaveis, preservando o acesso por perfil e mantendo o visual atual dos pais, com os destinos operacionais organizados por dominio.

## Estrutura aprovada
- `Dashboard`: destino direto existente.
- `Perfil`: destino direto existente.
- `Vendas`: Notas, Ranking, Campanhas e Extratos.
- `SAC`: Avisos, Fluxos, Scriptoteca, Wiki e FAQ.
- `Administracao`: Usuarios/Times, Configuracoes e Auditoria, seguidos da subdivisao `Operacao tecnica` com Status CaseFlow e CaseFlow Admin.
- `Como usar`: destino direto existente; nao e pai de Wiki ou FAQ.

## Escopo
- Reaproveitar integralmente o componente visual atual de `nav-item` nos seis pais.
- Aplicar a mesma arquitetura de seis entradas na barra central, com filhos revelados por clique ou teclado e sem dependencia de hover.
- Exibir somente grupos que possuam ao menos um filho permitido para o perfil autenticado.
- Manter exatamente as permissoes atuais de cada destino.
- Permitir apenas um grupo expandido por vez e manter aberto o grupo da pagina ativa.
- Exibir filhos recuados, com estado ativo, foco visivel e sem competir visualmente com os pais.
- Ao acionar um grupo com a sidebar recolhida, expandir a sidebar e revelar seus filhos.
- Renomear `Saude CaseFlow` para `Status CaseFlow` e posiciona-lo em `Administracao > Operacao tecnica`.
- Manter `Como usar` acessivel em um clique e preservar navegacao por hash.
- Preservar rotas especiais de Wiki e Avisos, breadcrumbs, busca global e navegacao programatica.
- Atualizar testes de papel e navegador para operar atraves dos grupos.

## Fora de escopo
- Alterar permissoes de API ou papeis.
- Redesenhar os seis botoes principais.
- Mover Wiki ou FAQ para `Como usar`.
- Remover monitoramento CaseFlow da aplicacao ou do Hub.
- Criar novas paginas de destino para os grupos.
- Refatorar views ou estilos sem relacao com a navegacao.

## Acceptance Criteria
1. Um ADMIN ve, nesta ordem, Dashboard, Perfil, Vendas, SAC, Administracao e Como usar como entradas principais.
2. O visual dos pais continua usando o `nav-item` atual, incluindo altura, tipografia, descricao, icone e estado ativo.
3. Cada grupo revela apenas filhos autorizados e apenas um grupo permanece aberto.
4. Wiki e FAQ aparecem dentro de SAC; Como usar permanece um destino direto.
5. Administracao separa visualmente os destinos de gestao da `Operacao tecnica`.
6. `Saude CaseFlow` deixa de existir como rotulo de navegacao e o destino passa a se chamar `Status CaseFlow`.
7. O grupo da pagina ativa abre automaticamente e o filho ativo fica identificavel.
8. Sidebar recolhida, teclado e viewports mobile continuam navegaveis sem sobreposicao ou overflow incoerente.
9. Matriz de papeis continua escondendo destinos proibidos no DOM navegavel.
10. A barra central usa os mesmos grupos e revela filhos por clique, `Enter` ou `Espaco`, sem fuga entre pai e submenu e com suporte a touch.
11. Testes unitarios, typecheck, build e smoke de navegacao passam.

## Validacao
- `npm run test --workspace @alwaystrack/web`: 54 testes aprovados.
- `npm run typecheck --workspace @alwaystrack/web`.
- `npm run build --workspace @alwaystrack/web`.
- `npx playwright test --list`: 35 cenarios compilados e listados.
- Smoke Playwright desktop iniciado, mas Chromium bloqueado pela dependencia externa ausente `libnspr4.so` antes de abrir a pagina.
- `npm run check:docs`.
- `npm run repo:hygiene`.
- `git diff --check`.

## Resultado
- Sidebar reduzida a seis pais para ADMIN, com o visual preexistente preservado.
- Barra central usa a mesma taxonomia e abre submenus anexos por clique ou teclado.
- Wiki e FAQ permanecem em SAC; Como usar continua direto.
- Administracao separa gestao de Operacao tecnica e exibe `Status CaseFlow` no lugar do rotulo ambiguo anterior.
- Permissoes originais permanecem aplicadas por filho e grupos vazios nao aparecem.

## Handoff
- handoff_to: product-owner
- execution_expectation: validar a nomenclatura e a descoberta dos grupos com os perfis ADMIN, GESTOR, SAC e VENDEDOR.
- constraints: novos modulos devem ser classificados em um dominio existente antes de criar outra entrada principal.
