# EXEC-AT-031 - Contextual help and Como usar comercial

## Metadata
- execution-id: EXEC-AT-031
- task: TASK-AT-045-contextual-help-how-to-use.md
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-08

## Objetivo
Ressuscitar a mecanica de `Como usar` e icones `i` do SyLembra, adaptando conteudo e anchors para o AlwaysTrack comercial.

## Arquivos alterados
1. `apps/web/src/main.tsx`
2. `docs/tasks/TASK-AT-045-contextual-help-how-to-use.md`
3. `docs/tasks/ROADMAP.md`
4. `docs/operations/orchestrator-state.md`

## Anchors finais
`#visao-geral`, `#primeiro-acesso`, `#dashboard-comercial`, `#upload-danfe`, `#status-das-notas`, `#reprocessamento-ia`, `#duplicidade-danfe`, `#aprovacao-de-notas`, `#ranking`, `#campanhas`, `#extratos`, `#wiki`, `#faq`, `#usuarios-times`, `#perfis-e-permissoes`, `#auditoria`, `#notificacoes-in-app`, `#glossario`, `#problemas-comuns`.

## Mapa de ajuda contextual
1. Notas: vendedor do upload e arquivo DANFE -> `#upload-danfe`.
2. Notas: filtro por vendedor, select all e selecao em lote -> `#aprovacao-de-notas`.
3. Notas: filtro de status -> `#status-das-notas`.
4. Notas: `Reprocessar IA` e feedback de extracao -> `#reprocessamento-ia`.
5. Notas: alerta de duplicidade -> `#duplicidade-danfe`.
6. Ranking: campanha e vendedor -> `#ranking`.
7. Campanhas: metrica, status, snapshot, base e atual -> `#campanhas`.
8. Extratos: campanha, grupo, vendedor e CSV -> `#extratos`.
9. Wiki: busca, status admin, slug e nota da decisao -> `#wiki`.
10. Usuarios/Times placeholder -> `#usuarios-times`.
11. Auditoria ja mantinha ajuda contextual ativa -> `#auditoria`.

## Notas de implementacao
- O `HelpTip` existente foi reaproveitado sem mudanca de componente: ele ja oferece tooltip por hover/focus, portal e dispatch para abrir a ajuda por hash.
- A pagina `Como usar` deixou de falar de licencas, RT, COREN, Meta/WhatsApp e compliance SyLembra, passando a cobrir DANFE, IA, duplicidade, aprovacao, ranking, campanhas, extratos, Wiki, FAQ, usuarios/times, auditoria e notificacoes in-app.
- O FAQ, notificacoes e usuarios/times aparecem como orientacao operacional e preparacao de UX, sem implementar backend novo fora desta task.
- Ainda existem `InfoTip`s em secoes legadas opt-in do antigo SyLembra; eles nao fazem parte da navegacao comercial ativa e devem ser removidos na fase de descontinuacao do legado.

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run build --workspace @alwaystrack/web`: passou.
- `npm run check`: passou, 26 arquivos de teste e 159 testes.

## Riscos residuais
- Secoes legadas ainda possuem anchors antigos e podem abrir ajuda sem destino se alguem acessar telas fora da navegacao comercial ativa.
- FAQ, notificacoes e CRUD de usuarios/times ainda dependem das tasks `TASK-AT-042`, `TASK-AT-043`, `TASK-AT-044` e `TASK-AT-039`.
