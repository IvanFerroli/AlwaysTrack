# TASK-AT-045 - Contextual help and Como usar revival

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-08
- source-of-truth: docs/tasks/TASK-AT-045-contextual-help-how-to-use.md

## Modo
- mode: implementation

## Objetivo unico
Ressuscitar e adaptar a mecanica de ajuda contextual do SyLembra para o AlwaysTrack comercial: pagina `Como usar`, icones `i` nos pontos certos, anchors estaveis e conteudo operacional curto por fluxo/role.

## Contexto minimo
O SyLembra tinha uma mecanica util de ajuda operacional: `Como usar`, `InfoTip`, `helpHref`, navegacao por hash, icones redondos com `i`, resumo no hover/focus e link para a secao exata da ajuda. Parte dessa estrutura ainda existe no runtime do AlwaysTrack, mas ha conteudo e anchors herdados do recorte antigo de profissionais/licencas/notificacoes. O pedido atual e reaproveitar o maximo possivel do archive SyLembra sem copiar legado cegamente, salpicando o AlwaysTrack com ajuda contextual parecida nos fluxos comerciais.

## Inputs
- Pedido do usuario em 2026-06-08 sobre ressuscitar `Como usar` e icones `i` do SyLembra.
- `docs/archive/sylembra/tasks/TASK-UX-005-ajuda-operacional-como-usar.md`
- `docs/archive/sylembra/tasks/TASK-UX-007-como-usar-robusto-ajuda-linkada.md`
- `docs/archive/sylembra/tasks/TASK-UX-008-ajuda-contextual-complementar-e-como-usar-intuitivo.md`
- `docs/archive/sylembra/tasks/TASK-UX-009-icones-svg-intuitivos-navegacao.md`
- `docs/archive/sylembra/Dossie_Apresentacao_Sylembra.md`
- `apps/web/src/main.tsx`
- `apps/web/src/components/operational.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/TASK-AT-040-wiki-published-slug-access.md`
- `docs/tasks/TASK-AT-042-faq-threads-mvp.md`
- `docs/tasks/TASK-AT-043-faq-promote-thread-to-wiki.md`

## Dependencias
- satisfeitas: app autenticado, roles comerciais, pagina `Como usar` existente, `InfoTip`/`HelpTip` existente, Wiki MVP.
- em aberto: FAQ threads e promocao FAQ -> Wiki sao complementares; links para FAQ devem ser opcionais ate `TASK-AT-042`/`TASK-AT-043` existirem.

## Alvos explicitos
1. `apps/web/src/main.tsx`: revisar `HelpView`, `helpAnchorIds`, navegacao `Como usar` e pontos de `InfoTip` nas telas comerciais.
2. `apps/web/src/components/operational.tsx`: reaproveitar/evoluir `HelpTip` para resumo, `href`, teclado, mobile e comportamento acessivel.
3. `apps/web/src/styles.css`: manter estilos existentes de `ui-info-button`, tooltip e secoes de ajuda, ajustando somente o necessario.
4. Conteudo operacional de `Como usar`: trocar linguagem SyLembra/licencas por AlwaysTrack comercial.
5. Wiki/FAQ: quando houver slug/thread disponivel, linkar ajuda curta para material mais completo sem bloquear o MVP.

## Fora de escopo
- Implementar tour guiado, video, LMS ou onboarding complexo.
- Criar backend novo apenas para ajuda.
- Copiar conteudo de compliance/licencas/RT/COREN para o produto comercial.
- Resolver bugs de fluxo de notas, ranking ou Wiki; esta task so orienta o uso.
- Criar FAQ threads se `TASK-AT-042` ainda nao estiver implementada.

## Inventario obrigatorio de UI
Mapear antes de editar e decidir onde ajuda reduz erro real:
1. Dashboard: cards de notas, vendas, ranking, filas e atalhos.
2. Notas: upload de DANFE, status, filtros, `Analisar`, `Reprocessar IA`, `Editar revisao`, `Aprovar`, `Rejeitar`, duplicidade e warnings.
3. Ranking: periodo, campanha, vendedor/grupo, comparacao de snapshots e leitura de posicao.
4. Campanhas: metrica, periodo, grupo, status e snapshots.
5. Extratos: filtros, consolidacao geral/vendedor/grupo e exportacao CSV/JSON.
6. Wiki: busca, tags, slug, editor Markdown, imagens, propostas e revisao.
7. FAQ: quando existir, threads, estados, promocao para Wiki e backlink.
8. Usuarios/Times: roles comerciais, vendedor vinculado, supervisor/grupo e escopo.
9. Auditoria: acao, entidade, registro, usuario e leitura de metadados.
10. Notificacoes in-app: quando `TASK-AT-044` existir, contador, lidas/nao lidas e links internos.

## Regras de conteudo
1. Usar linguagem operacional curta, nao marketing.
2. Cada `i` deve responder uma duvida provavel, termo tecnico ou decisao de risco; nao colocar `i` em todo campo.
3. Tooltip/resumo deve ser curto; explicacao completa fica no `Como usar`, Wiki ou FAQ.
4. Evitar jargao sem explicar: `DANFE`, `chave de acesso`, `duplicidade`, `PENDING_REVIEW`, `APPROVED`, `snapshot`, `slug`, `tenant`, `role`.
5. Adaptar por papel quando fizer sentido: ADMIN/GESTOR, SAC, FINANCEIRO, VENDEDOR e SUPERVISOR.
6. Nao expor tokens, secrets, IDs sensiveis, dados reais de cliente ou detalhes internos que nao ajudem a operacao.
7. Se houver Wiki/FAQ publicada, linkar como aprofundamento; se nao houver, deixar link interno para `Como usar`.

## Anchors recomendadas
Usar anchors estaveis e comerciais, por exemplo:
- `#visao-geral`
- `#primeiro-acesso`
- `#dashboard-comercial`
- `#upload-danfe`
- `#status-das-notas`
- `#reprocessamento-ia`
- `#duplicidade-danfe`
- `#aprovacao-de-notas`
- `#ranking`
- `#campanhas`
- `#extratos`
- `#wiki`
- `#faq`
- `#usuarios-times`
- `#perfis-e-permissoes`
- `#auditoria`
- `#notificacoes-in-app`
- `#glossario`
- `#problemas-comuns`

## Checklist
1. Inventariar todos os `InfoTip`, `HelpTip`, `helpHref` e anchors existentes no app.
2. Remover ou adaptar anchors herdadas de SyLembra que nao fazem sentido no AlwaysTrack comercial.
3. Definir componente reutilizavel de ajuda contextual, aproveitando o `HelpTip` existente sempre que possivel.
4. Garantir que todo `i` tenha resumo curto, `aria-label`, foco por teclado e comportamento mobile sem depender apenas de hover.
5. Reescrever `Como usar` para os fluxos comerciais: dashboard, notas/DANFE, reprocessamento, duplicidade, aprovacao, ranking, campanhas, extratos, Wiki, FAQ, usuarios/times, auditoria e notificacoes.
6. Adicionar `i` somente nos pontos de decisao operacional ou risco: upload, status, reprocessar IA, duplicate, aprovar/rejeitar, filtros de ranking/extratos, snapshot, metrica de campanha, slug/revisao Wiki, roles e auditoria.
7. Incluir links opcionais para Wiki/FAQ quando houver pagina/thread publicada; manter fallback para anchors internas.
8. Validar que clique/Enter no `i` abre a secao correta e realca brevemente o alvo, reaproveitando o padrao SyLembra quando estiver saudavel.
9. Revisar desktop/mobile para garantir que os icones nao quebrem labels, filtros ou tabelas.
10. Documentar no EXEC a lista de anchors e mapa de `i -> destino`.

## Acceptance Criteria
1. Usuario autenticado encontra `Como usar` em ate um clique a partir de qualquer tela autenticada.
2. `Como usar` fala de AlwaysTrack comercial, sem sobras de licencas, RT, COREN, Meta/WhatsApp legado ou compliance SyLembra fora de contexto.
3. Os principais fluxos comerciais tem ajuda curta e acionavel: upload de DANFE, status, reprocessamento por IA, duplicidade, aprovacao, ranking, campanhas, extratos, Wiki, FAQ, usuarios/times e auditoria.
4. Todo `i` visivel mostra resumo no hover/focus e leva ao trecho correto do `Como usar`, Wiki ou FAQ.
5. Ajuda respeita contexto por role: o usuario nao recebe instrucao como se pudesse operar acao indisponivel para seu perfil.
6. O componente de ajuda e reutilizavel e segue o estilo visual existente.
7. Nenhum tooltip/help text cobre conteudo importante, quebra layout mobile ou vira manual dentro da tela.
8. Build/check continuam verdes.

## Definition of Done
1. Inventario de pontos de ajuda registrado no EXEC.
2. Anchors comerciais implementadas e listadas no EXEC.
3. Conteudo SyLembra util foi reaproveitado como padrao de interacao, nao como texto de negocio legado.
4. Ajuda contextual cobre os pontos de maior risco operacional.
5. Revisao manual feita nas telas comerciais principais e na pagina `Como usar`.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: login como ADMIN/GESTOR, SAC/FINANCEIRO quando disponivel, VENDEDOR e SUPERVISOR; abrir Dashboard, Notas, Ranking, Campanhas, Extratos, Wiki, Usuarios/Times, Auditoria e Como usar; testar mouse, teclado e mobile.
- acessibilidade manual: Tab chega nos `i`; Enter ativa; tooltip aparece em focus; link navega para anchor correta.

## Evidencia esperada
- Lista de anchors finais.
- Mapa de icones `i` adicionados/adaptados e seus destinos.
- Print ou relato de `Como usar` comercial.
- Print ou relato de pelo menos tres `i` em telas diferentes abrindo a secao correta.
- Resultado dos comandos de validacao.

## Riscos
- Reaproveitamento cego do SyLembra pode trazer texto de compliance para o produto comercial; revisar todos os termos.
- Excesso de icones `i` pode poluir a interface; priorizar duvidas reais.
- Anchors podem quebrar se o conteudo mudar; manter lista centralizada.
- Ajuda pode ficar longa demais; usar sumario, blocos curtos e links para Wiki/FAQ.
- Links para FAQ/Wiki podem depender de tasks ainda propostas; usar fallback.

## Blockers possiveis
- Falta de definicao final de termos comerciais usados pela operacao.
- `TASK-AT-042`/`TASK-AT-043` ainda nao implementadas para links de FAQ completos.
- Roles comerciais ainda em evolucao em `TASK-AT-039`.

## Retorno esperado
- resumo curto do que mudou
- arquivos alterados
- anchors implementadas
- mapa `i -> destino`
- evidencia de validacao
- riscos residuais
- sugestao de commit
