# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/ROADMAP.md

## Objetivo
Construir o AlwaysTrack como ferramenta comercial para empresa de suplementos: vendedores sobem DANFEs, o sistema extrai dados, alimenta ranking/campanhas, dashboard e extratos por role.

## Legado
O dominio SyLembra/licencas/compliance fica como legado tecnico reaproveitavel. Nao usar profissionais, licencas, RT, COREN, vencimento ou regularizacao como backlog ativo.

## Trilha concluida antes do pivot
1. `TASK-AT-001` a `TASK-AT-008`, `TASK-AT-011`: entregaram base visual, runtime, wiki, checks e smoke, mas ainda sobre recorte errado.
2. `TASK-AT-009` e `TASK-AT-010`: canceladas por pertencerem ao recorte de compliance/licencas.

## Trilha atual - AlwaysTrack comercial
1. `TASK-AT-012-product-pivot-sales-operations.md`: pivot canonico para operacao comercial. Status: completed.
2. `TASK-AT-013-commercial-roles-access.md`: roles comerciais e escopo base. Status: completed.
3. `TASK-AT-015-commercial-domain-model.md`: schema de vendedores, grupos, notas, itens, campanhas e ranking. Status: completed.
4. `TASK-AT-024-commercial-users-teams-seed.md`: seed comercial de usuarios, vendedor e time. Status: completed.
5. `TASK-AT-016-seller-danfe-upload.md`: upload autenticado de DANFE. Status: completed-mvp.
6. `TASK-AT-020-commercial-dashboard-initial.md`: dashboard comercial inicial. Status: completed.
7. `TASK-AT-023-frankenstein-ui-cleanup.md`: navegacao ativa comercial e rotas legadas opt-in. Status: completed-mvp.
8. `TASK-AT-017-danfe-structured-extraction.md`: extracao estruturada de DANFE com IA. Status: completed-mvp.
9. `TASK-AT-018-sales-document-review.md`: revisao/aprovacao MVP de notas. Status: completed-mvp.
10. `TASK-AT-019-ranking-campaigns-mvp.md`: ranking, campanhas e snapshots. Status: completed-mvp.
11. `TASK-AT-021-sales-statements-mvp.md`: extratos JSON/CSV simples. Status: completed-mvp.
12. `TASK-AT-025-sales-danfe-diagnostic-logs.md`: logs diagnosticos do fluxo DANFE. Status: completed-mvp.
13. `TASK-AT-028-danfe-deterministic-extraction.md`: extracao deterministica de DANFE PDF textual antes da IA. Status: completed-mvp.
14. `EXEC-AT-009`: filtros visuais de ranking/extratos e CSV filtrado. Status: completed.
15. `EXEC-AT-010`: extracao deterministica de XML NF-e. Status: completed.
16. `EXEC-AT-011`: planejamento da Wiki rica e tasks `AT-029` a `AT-036`. Status: completed.
17. `EXEC-AT-012`: Wiki Markdown editor MVP (`AT-029`/`AT-030`/`AT-031`). Status: completed.
18. `EXEC-AT-013`: Wiki content admin MVP (`AT-034`). Status: completed.
19. `EXEC-AT-014`: Wiki discovery MVP (`AT-035`) e review digest parcial (`AT-033`). Status: completed.
20. `EXEC-AT-015`: Wiki image attachments MVP (`AT-032`). Status: completed.
21. `EXEC-AT-016`: Wiki rich review MVP (`AT-033`). Status: completed.
22. `EXEC-AT-017`: editor visual de revisao de DANFE (`AT-018B`). Status: completed.
23. `EXEC-AT-018`: CRUD de campanhas e snapshots (`AT-019B`). Status: completed.
24. `EXEC-AT-019`: descontinuacao SyLembra fase 1 (`AT-023`/`AT-027`). Status: completed.
25. `EXEC-AT-020`: Google login como entrada principal (`TASK-AT-014`). Status: completed.
26. `EXEC-AT-021`: seed/flush local comercial por padrao com fixtures SyLembra default-off (`AT-027B`). Status: completed.
27. `EXEC-AT-022`: filtro visual por vendedor no ranking e comparacao leve de snapshots (`AT-019C`). Status: completed.
28. `EXEC-AT-023`: consolidacoes backend de extratos por vendedor/grupo (`AT-021B`). Status: completed.
29. `EXEC-AT-024`: smoke/e2e do fluxo comercial com upload XML/PDF (`TASK-AT-026`). Status: completed.
30. `EXEC-AT-025`: UI de consolidacoes de extratos por vendedor/grupo (`AT-021B`). Status: completed.
31. `EXEC-AT-026`: fila operacional de aprovacao de notas com filtros por envio/vendedor/status, selecao multipla, select all visivel, acoes em lote de aprovar/rejeitar e comentario auditavel (`TASK-AT-037`). Status: completed.
32. `EXEC-AT-027`: dedupe interno de pacote deterministico e feedback observavel do reprocessamento (`TASK-AT-038`). Status: completed-partial.
33. `EXEC-AT-028`: setup do gate de ranking com tres vendedores, endpoint de vendedores e upload administrativo por vendedor (`TASK-AT-046`). Status: completed-partial.
34. `EXEC-AT-029`: acesso autenticado da Wiki por slug publicado (`TASK-AT-040`). Status: completed.
35. `EXEC-AT-030`: comentarios/notas de decisao em review Wiki visiveis no historico (`TASK-AT-041`). Status: completed.
36. `EXEC-AT-031`: `Como usar` comercial e icones `i` contextuais em Notas, Ranking, Campanhas, Extratos, Wiki, Usuarios/Times e Auditoria (`TASK-AT-045`). Status: completed.
37. `EXEC-AT-032`: CRUD administrativo comercial de usuarios/roles em `Usuarios/Times`, com vinculo de vendedor a `SellerProfile` e supervisor a grupo comercial (`TASK-AT-039`). Status: completed.
38. `EXEC-AT-033`: FAQ interna em threads com comentarios/reacoes/estado e promocao de thread para Wiki com backlink (`TASK-AT-042`/`TASK-AT-043`). Status: completed.
39. `EXEC-AT-034`: centro de notificacoes in-app com eventos de notas, Wiki e FAQ, badge no topo e leitura individual/geral (`TASK-AT-044`). Status: completed.
40. `EXEC-AT-035`: validacao final do ranking com tres vendedores e do reprocessamento idempotente sem duplicata falsa (`TASK-AT-046`/`TASK-AT-038`). Status: completed.
41. `EXEC-AT-036`: estrategia de testes, scripts separados, TypeDoc e docs de arquitetura transversal (`TASK-AT-047`/`TASK-AT-048`). Status: completed.
42. `EXEC-AT-037`: Playwright smoke, migration gate, Artillery smoke/1000, CI e onboarding (`TASK-AT-049`/`TASK-AT-050`/`TASK-AT-051`/`TASK-AT-055`). Status: completed.
43. `EXEC-AT-038`: observabilidade HTTP/Prisma e inventario de hotspots de hardening (`TASK-AT-053`/`TASK-AT-054`). Status: completed.
44. `EXEC-AT-039`: ADR/piloto BullMQ para snapshots de ranking e extracao do cliente API web (`TASK-AT-052`/`TASK-AT-054`). Status: completed.
45. `EXEC-AT-040`: polimento visual de logo e overflow de botoes/listas na Wiki/FAQ (`TASK-AT-056`). Status: completed.
46. `EXEC-AT-041`: regressao Playwright API para FAQ->Wiki, notificacoes e criacao/listagem de usuario (`TASK-AT-049`). Status: completed.
47. `EXEC-AT-042`: endpoint/contrato de status observavel para job BullMQ piloto de snapshots de ranking (`TASK-AT-052`). Status: completed.
48. `EXEC-AT-043`: UI de Campanhas conectada ao status observavel do job de snapshots de ranking (`TASK-AT-052`). Status: completed.
49. `EXEC-AT-044`: extracao de contratos/helpers comerciais frontend para `apps/web/src/sales.ts` (`TASK-AT-054`). Status: completed.
50. `EXEC-AT-045`: extracao da view de Campanhas para `apps/web/src/views/campaigns.tsx` (`TASK-AT-054`). Status: completed.
51. `EXEC-AT-046`: extracao da view de Ranking para `apps/web/src/views/ranking.tsx` (`TASK-AT-054`). Status: completed.
52. `EXEC-AT-047`: extracao das views de Dashboard e Extratos para `apps/web/src/views/dashboard.tsx` e `apps/web/src/views/statements.tsx` (`TASK-AT-054`). Status: completed.
53. `EXEC-AT-048`: extracao das views de FAQ e Auditoria para `apps/web/src/views/faq.tsx` e `apps/web/src/views/audit.tsx` (`TASK-AT-054`). Status: completed.
54. `EXEC-AT-049`: extracao da view de Usuarios/Times para `apps/web/src/views/users-teams.tsx` (`TASK-AT-054`). Status: completed.
55. `EXEC-AT-050`: extracao da view de Notas para `apps/web/src/views/notes.tsx` (`TASK-AT-054`). Status: completed.
56. `EXEC-AT-051`: extracao da view Como usar para `apps/web/src/views/help.tsx` (`TASK-AT-054`). Status: completed.
57. `EXEC-AT-052`: extracao da view Wiki e do centro de notificacoes para modulos dedicados (`TASK-AT-054`). Status: completed.
58. `EXEC-AT-053`: regressao Playwright de navegador para upload/aprovacao DANFE e review Wiki com comentario (`TASK-AT-049`). Status: completed-with-host-environment-note.
59. `EXEC-AT-054`: validacao BullMQ com Redis real via teste opcional, CI dedicado, compose e guard de ambiente (`TASK-AT-052`). Status: completed.
60. `EXEC-AT-055`: workflow de relatorio Artillery com snapshots diagnosticos e bloqueio de benchmark 1000 em localhost (`TASK-AT-051`/`TASK-AT-053`). Status: completed-partial.
61. `EXEC-AT-056`: Google login restrito por dominio corporativo e env guard (`TASK-AT-057`). Status: completed.
62. `EXEC-AT-057`: reset de senha por admin validado e testes reforcados (`TASK-AT-058`). Status: completed.
63. `EXEC-AT-058`: grafico dinamico no dashboard comercial por range/vendedor/grupo (`TASK-AT-060`). Status: completed.
64. `EXEC-AT-059`: tags padrao/customizadas e busca combinada em Wiki/FAQ (`TASK-AT-061`). Status: completed.
65. `EXEC-AT-060`: pagina Perfil com avatar URL, dados readonly e historico de notificacoes (`TASK-AT-059`). Status: completed.
66. `EXEC-AT-061`: matriz canonica de permissoes comerciais em docs/API/UI (`TASK-AT-062`). Status: completed.
67. `EXEC-AT-062`: configuracoes administrativas da organizacao com nome/logo/defaults/dominio Google readonly (`TASK-AT-063`). Status: completed.
68. `EXEC-AT-063`: exports CSV de ranking, dashboard e extratos com filtros, metadados, nome por periodo e auditoria (`TASK-AT-064`). Status: completed.
69. `EXEC-AT-064`: prontidao de demo com roteiro, seed comercial reforcado, empty states e auditoria consultavel (`TASK-AT-065`). Status: completed.
70. `EXEC-AT-065`: polimento visual guiado por prints com ajustes de grafico/header, padding, botoes e paginacao em Notas/Extratos/Wiki/FAQ (`TASK-AT-066`). Status: completed.
71. `EXEC-AT-066`: correcao follow-up de header sem scrollbar, Perfil fora do sidebar, sidebar colapsavel e cards Wiki/FAQ sem overflow (`TASK-AT-067`). Status: completed.
72. `EXEC-AT-067`: correcao de interpretacao para Perfil em segundo no sidebar e atalhos do header em faixa unica full-width (`TASK-AT-068`). Status: completed.
73. `EXEC-AT-068`: Central Operacional Hoje com endpoint agregado, cards acionaveis e filtros iniciais (`TASK-AT-069`). Status: completed.
74. `EXEC-AT-069`: matriz visual de permissoes em Configuracoes usando a matriz canonica compartilhada (`TASK-AT-077`). Status: completed.
75. `EXEC-AT-070`: ranking explicavel com endpoint de composicao por vendedor e painel de prova na UI (`TASK-AT-070`). Status: completed.
76. `EXEC-AT-071`: timeline visual por DANFE/nota com eventos de documento, extracao e auditoria (`TASK-AT-071`). Status: completed.
77. `EXEC-AT-072`: modo demo guiado com reset local seguro, faixa visual opcional e roteiro atualizado (`TASK-AT-072`). Status: completed.
78. `EXEC-AT-073`: diagnostico de DANFE com extracao, falhas, duplicidades, reprocessamento e correcao manual auditavel (`TASK-AT-073`). Status: completed.
79. `EXEC-AT-081`: painel minimo de observabilidade operacional em Configuracoes, com metricas HTTP, volumes e falhas recentes (`TASK-AT-081`). Status: completed.
80. `EXEC-AT-080`: notificacoes in-app com filtro de nao lidas, agrupamento por tipo e links internos mais confiaveis (`TASK-AT-080`). Status: completed.
81. `EXEC-AT-079`: busca global simples com endpoint agrupado e popover no header (`TASK-AT-079`). Status: completed.
82. `EXEC-AT-078`: curadoria Wiki/FAQ com sem resposta, validacao e relacionados por tags (`TASK-AT-078`). Status: completed.
83. `EXEC-AT-082`: aba de Avisos e comunicados internos com leitura/editor (`TASK-AT-082`). Status: completed.
84. `EXEC-AT-083`: modelo de dados e permissoes para Avisos (`TASK-AT-083`). Status: completed.
85. `EXEC-AT-084`: editor rico e leitura de Avisos (`TASK-AT-084`). Status: completed.
86. `EXEC-AT-085`: notificacoes e ciencia de Avisos (`TASK-AT-085`). Status: completed.
87. `EXEC-AT-086`: Avisos na Central Operacional Hoje (`TASK-AT-086`). Status: completed.
88. `EXEC-AT-087`: vinculos, busca e governanca simples de Avisos (`TASK-AT-087`). Status: completed.
89. `EXEC-AT-098`: fechamento da frente de Avisos com vigencia, multiplos links, CTA profundo e testes (`TASK-AT-098`). Status: completed.
90. `EXEC-AT-088`: Scriptoteca Operacional do SAC MVP com categorias, scripts, busca, preview, copia e seed demo (`TASK-AT-088`). Status: completed-mvp.
91. `EXEC-AT-089`: modelo de dados e permissoes da Scriptoteca (`TASK-AT-089`). Status: completed.
92. `EXEC-AT-090`: navegacao por categoria e preview da Scriptoteca (`TASK-AT-090`). Status: completed.
93. `EXEC-AT-091`: busca, tags e filtros da Scriptoteca, incluindo busca global (`TASK-AT-091`). Status: completed.
94. `EXEC-AT-092`: copia em um clique e placeholders da Scriptoteca (`TASK-AT-092`). Status: completed.
95. `EXEC-AT-095`: vinculos da Scriptoteca com Wiki e FAQ (`TASK-AT-095`). Status: completed.
96. `EXEC-AT-099`: validade e recertificacao de scripts (`TASK-AT-099`). Status: completed-mvp.
97. `EXEC-AT-094`: historico visual, eventos e restauracao segura de scripts (`TASK-AT-094`). Status: completed.
98. `EXEC-AT-075`: Playwright/CI limpo com smoke dedicado e nota de dependencia local (`TASK-AT-075`). Status: completed-with-local-environment-note.
99. `EXEC-AT-076`: paginacao server-side nas telas criticas sem tocar Scriptoteca (`TASK-AT-076`). Status: completed-critical-screens.
100. `EXEC-AT-093`: sugestoes e decisao de scripts SAC (`TASK-AT-093`). Status: completed.
101. `EXEC-AT-097`: metricas de uso e lacunas da Scriptoteca (`TASK-AT-097`). Status: completed.
102. `EXEC-AT-100`: polimento visual das metricas da Scriptoteca e botao compacto de copia (`TASK-AT-100`). Status: completed.
103. `TASK-AT-117`: TypeDoc robusto para onboarding tecnico. Status: completed.
104. `TASK-AT-118`: `npm run up` como bancada de estudo local. Status: completed.
105. `TASK-AT-119`: deep dive de fluxos de manutencao para onboarding. Status: completed.
106. `TASK-AT-120`: checklist rapido de diagnostico para retomada e manutencao. Status: completed.
107. `EXEC-AT-102`: modelo de ameacas e auditoria base da fase de seguranca (`TASK-AT-102`). Status: completed.
108. `EXEC-AT-103`: headers HTTP, CORS e perimetro web (`TASK-AT-103`). Status: completed.
109. `EXEC-AT-104`: hardening de login, senha e sessao (`TASK-AT-104`). Status: completed.
110. `EXEC-AT-105`: protecao CSRF e validacao de origem (`TASK-AT-105`). Status: completed.
111. `EXEC-AT-106`: rate limit e protecao contra abuso (`TASK-AT-106`). Status: completed.
112. `EXEC-AT-108`: hardening de uploads e arquivos (`TASK-AT-108`). Status: completed.
113. `EXEC-AT-109`: autorizacao, tenancy e testes anti-IDOR (`TASK-AT-109`). Status: completed.
114. `EXEC-AT-110`: segredos, envs e deploy de producao (`TASK-AT-110`). Status: completed.
115. `EXEC-AT-111`: auditoria, monitoramento e alertas (`TASK-AT-111`). Status: completed.
116. `EXEC-AT-112`: dependencias, SCA e gates no CI (`TASK-AT-112`). Status: completed.
117. `EXEC-AT-107`: validacao runtime de entrada e contratos de API (`TASK-AT-107`). Status: completed-active-surfaces.
118. `EXEC-AT-113`: banco, backup e protecao de dados (`TASK-AT-113`). Status: completed-docs.
119. `EXEC-AT-114`: integracoes externas, webhooks e IA (`TASK-AT-114`). Status: completed.
120. `EXEC-AT-115`: runbook de incidente e operacao segura (`TASK-AT-115`). Status: completed.
121. `EXEC-AT-116`: gate antes de exposicao externa (`TASK-AT-116`). Status: completed-no-go-until-prod.
122. `EXEC-AT-101`: anexos de imagem transversais em conteudo operacional (`TASK-AT-101`). Status: completed-mvp.
123. `EXEC-AT-121`: `npm run up` como bancada completa de estudo, com instalacao, setup, TypeDoc, app, Prisma Studio, reports existentes e smoke local opcional (`TASK-AT-121`). Status: completed.
124. `EXEC-AT-122`: auditoria de testes/documentacao das mudancas recentes e mapa de lacunas residuais (`TASK-AT-122`). Status: completed.
125. `EXEC-AT-123`: Scriptoteca com botao compacto de clipboard para copia rapida (`TASK-AT-123`). Status: completed.
126. `EXEC-AT-130`: Fluxos de Atendimento guiado com etapas, decisoes e scripts relacionados (`TASK-AT-130`). Status: completed-mvp.
127. `EXEC-AT-131`: editor rico tipo Wiki no cadastro de Fluxos (`TASK-AT-131`). Status: completed-mvp.
128. `EXEC-AT-132`: construtor visual MVP de decisoes por etapa (`TASK-AT-132`). Status: completed-mvp.
129. `EXEC-AT-134`: recomendacao MVP de scripts por etapa de fluxo (`TASK-AT-134`). Status: completed-mvp.
130. `EXEC-AT-124`: modo atendimento rapido da Scriptoteca (`TASK-AT-124`). Status: completed-mvp.
131. `EXEC-AT-125`: qualidade/seguranca de placeholders da Scriptoteca (`TASK-AT-125`). Status: completed-mvp.
132. `EXEC-AT-133`: execucao auditavel de Fluxos de Atendimento (`TASK-AT-133`). Status: completed-mvp.
133. `EXEC-AT-135`: governanca e versionamento de Fluxos de Atendimento (`TASK-AT-135`). Status: completed-mvp.
134. `EXEC-AT-136`: metricas de uso dos Fluxos de Atendimento (`TASK-AT-136`). Status: completed-mvp.
135. `EXEC-AT-127`: painel de governanca da Scriptoteca (`TASK-AT-127`). Status: completed-mvp.
136. `EXEC-AT-137`: scripts pessoais privados por atendente (`TASK-AT-137`). Status: completed-mvp.
137. `EXEC-AT-138`: seletor de Fluxos por busca e dropdown (`TASK-AT-138`). Status: completed-mvp.
138. `EXEC-AT-128`: revisao rica de sugestoes da Scriptoteca (`TASK-AT-128`). Status: completed-mvp.
139. `EXEC-AT-129`: formatacao por canal na Scriptoteca (`TASK-AT-129`). Status: completed-mvp.
140. `EXEC-AT-139`: emoji picker transversal nos editores ricos (`TASK-AT-139`). Status: completed-mvp.
141. `EXEC-AT-126`: pacotes e roteiros de atendimento na Scriptoteca (`TASK-AT-126`). Status: completed-mvp.
142. `EXEC-AT-140`: edicao e reordenacao visual de pacotes da Scriptoteca (`TASK-AT-140`). Status: completed-mvp.
143. `EXEC-AT-141`: validacao runtime dos payloads da Scriptoteca (`TASK-AT-141`). Status: completed-mvp.
144. `EXEC-AT-142`: regressao e stress dos pacotes da Scriptoteca (`TASK-AT-142`). Status: completed-mvp.
145. `EXEC-AT-143`: validacao runtime residual em Avisos, Configuracoes, Notificacoes e Fluxos (`TASK-AT-143`). Status: completed-mvp.
146. `EXEC-AT-144`: workbench local com indice navegavel de reports (`TASK-AT-144`). Status: completed-mvp.
147. `EXEC-AT-145`: coverage HTML da API e documentacao de leitura (`TASK-AT-145`). Status: completed-mvp.
148. `EXEC-AT-148`: timeout/redaction para integracoes externas criticas (`TASK-AT-148`). Status: completed-mvp.
149. `EXEC-AT-146`: arquivamento auditavel de anexos da Wiki (`TASK-AT-146`). Status: completed-mvp.
150. `EXEC-AT-147`: runbook de prontidao Postgres/storage externo (`TASK-AT-147`). Status: completed-docs.
151. `EXEC-AT-152`: Google Sheets/Drive com timeout via `externalFetch` (`TASK-AT-152`). Status: completed.
152. `EXEC-AT-074`: polimento visual por print da Scriptoteca (`TASK-AT-074`). Status: completed-screenshot-slice.
153. `EXEC-AT-153`: drag/drop de scripts em roteiros da Scriptoteca (`TASK-AT-153`). Status: completed-mvp.
154. `EXEC-AT-150`: provider S3-compatible para storage privado (`TASK-AT-150`). Status: completed-mvp.
155. `EXEC-AT-151`: entidade generica de anexos operacionais para Avisos/FAQ/Fluxos/Scriptoteca (`TASK-AT-151`). Status: completed.
156. `EXEC-AT-149`: preflight de migracao real Postgres e guardas de backup/storage (`TASK-AT-149`). Status: blocked-external-infra-ready.
157. `EXEC-AT-154`: Fase Beta Fechado por Permissoes com matriz, backend, busca, frontend, allowlist, banner, runbook e checklists (`TASK-AT-154` a `TASK-AT-165`). Status: completed-mvp.
158. `EXEC-AT-157`: regressao negativa e comando integrado de preflight do beta. Status: completed-host-gate-pending.
159. `EXEC-AT-167`: fechamento de Playwright, validacao runtime ativa e anexos operacionais por superficie. Status: completed.

## Proximas tasks recomendadas
1. `TASK-AT-183-smartscript-real-capture-contract.md`: iniciar a Fase H do SmartScript com contrato do nucleo real de logging/captura.
2. `TASK-AT-184-smartscript-local-logger-control-plane.md`: tornar `start/stop/status/pause/resume` controles reais do logger local.
3. `TASK-AT-166-beta-host-preflight-and-evidence.md`: executar o gate final do beta na maquina host quando houver ambiente real.
4. `TASK-AT-149-prod-postgres-migration-execution.md`: executar migracao real para Postgres quando houver infraestrutura/credenciais.

## Backlog proposto - reta final produto interno
1. `TASK-AT-057`: Google login restrito por dominio corporativo. Status: completed.
2. `TASK-AT-058`: recuperacao de senha com reset por admin. Status: completed.
3. `TASK-AT-059`: pagina de perfil do usuario. Status: completed.
4. `TASK-AT-060`: grafico dinamico no dashboard. Status: completed.
5. `TASK-AT-061`: tags e busca combinada em Wiki/FAQ. Status: completed.
6. `TASK-AT-062`: matriz de permissoes comercial. Status: completed.
7. `TASK-AT-063`: configuracoes da organizacao. Status: completed.
8. `TASK-AT-064`: exportacoes comerciais polidas. Status: completed.
9. `TASK-AT-065`: prontidao para demo, estados vazios e auditoria. Status: completed.
10. `TASK-AT-066`: polimento visual guiado por prints. Status: completed.
11. `TASK-AT-067`: follow-up de header/sidebar/overflow visual. Status: completed.
12. `TASK-AT-068`: correcao de interpretacao do header/sidebar. Status: completed.

## Backlog proposto - consolidacao produto interno definitivo

### Fase A - Impacto para apresentacao
1. `TASK-AT-069`: Central Operacional Hoje. Status: completed-mvp.
2. `TASK-AT-070`: Ranking explicavel. Status: completed-mvp.
3. `TASK-AT-071`: Timeline visual da nota. Status: completed-mvp.
4. `TASK-AT-072`: Modo demo guiado. Status: completed-mvp.
5. `TASK-AT-074`: Polimento visual final por prints reais. Status: completed-screenshot-slice.

### Fase B - Confiabilidade operacional
1. `TASK-AT-073`: Diagnostico de DANFE e correcao manual auditavel. Status: completed-mvp.
2. `TASK-AT-075`: Playwright/CI limpo. Status: completed-with-local-environment-note.
3. `TASK-AT-076`: Paginacao server-side em telas criticas. Status: completed-critical-screens.
4. `TASK-AT-081`: Painel minimo de observabilidade operacional. Status: completed-mvp.

### Fase C - Produto interno definitivo
1. `TASK-AT-077`: Matriz visual de permissoes. Status: completed.
2. `TASK-AT-078`: Curadoria clara de Wiki/FAQ. Status: completed-mvp.
3. `TASK-AT-079`: Busca global simples. Status: completed-mvp.
4. `TASK-AT-080`: Notificacoes mais uteis. Status: completed-mvp.
5. `TASK-AT-082`: Aba de avisos e comunicados internos. Status: completed.
6. `TASK-AT-083`: Avisos - modelo de dados e permissoes. Status: completed.
7. `TASK-AT-084`: Avisos - editor rico e leitura. Status: completed.
8. `TASK-AT-085`: Avisos - notificacoes e ciencia. Status: completed.
9. `TASK-AT-086`: Avisos - integracao com Central Operacional Hoje. Status: completed.
10. `TASK-AT-087`: Avisos - vinculos, busca e governanca. Status: completed.
11. `TASK-AT-098`: Fechamento da frente de Avisos. Status: completed.
12. `TASK-AT-088`: Scriptoteca Operacional do SAC. Status: completed-mvp.
13. `TASK-AT-089`: Scriptoteca - modelo de dados e permissoes. Status: completed.
14. `TASK-AT-090`: Scriptoteca - navegacao por categoria e preview. Status: completed.
15. `TASK-AT-091`: Scriptoteca - busca, tags e filtros. Status: completed.
16. `TASK-AT-092`: Scriptoteca - copiar texto e placeholders. Status: completed.
17. `TASK-AT-093`: Scriptoteca - CRUD, sugestoes e validacao. Status: completed.
18. `TASK-AT-094`: Scriptoteca - historico e versionamento simples. Status: completed.
19. `TASK-AT-095`: Scriptoteca - vinculos com Wiki e FAQ. Status: completed.
20. `TASK-AT-096`: Scriptoteca - seeds e demo com scripts reais. Status: completed-mvp.
21. `TASK-AT-097`: Scriptoteca - metricas de uso e lacunas. Status: completed.
22. `TASK-AT-099`: Scriptoteca - validade e recertificacao de scripts. Status: completed-mvp.
23. `TASK-AT-100`: Scriptoteca - polimento visual de metricas e copia. Status: completed.
24. `TASK-AT-101`: Anexos de imagem transversais em conteudo operacional. Status: completed-mvp.
25. `TASK-AT-123`: Scriptoteca - clipe de copia rapida. Status: completed.
26. `TASK-AT-124`: Scriptoteca - modo atendimento rapido. Status: completed-mvp.
27. `TASK-AT-125`: Scriptoteca - qualidade de placeholders. Status: completed-mvp.
28. `TASK-AT-126`: Scriptoteca - pacotes e roteiros de atendimento. Status: completed-mvp.
29. `TASK-AT-127`: Scriptoteca - painel de governanca. Status: completed-mvp.
30. `TASK-AT-128`: Scriptoteca - revisao rica de sugestoes. Status: completed-mvp.
31. `TASK-AT-129`: Scriptoteca - formatacao por canal. Status: completed-mvp.
32. `TASK-AT-130`: Fluxos de atendimento guiado MVP. Status: completed-mvp.
33. `TASK-AT-131`: Fluxos com editor rico tipo Wiki. Status: completed-mvp.
34. `TASK-AT-132`: Construtor visual de decisoes. Status: completed-mvp.
35. `TASK-AT-133`: Execucao auditavel de fluxo por atendimento. Status: completed-mvp.
36. `TASK-AT-134`: Recomendacao de scripts por etapa. Status: completed-mvp.
37. `TASK-AT-135`: Governanca e versionamento de fluxos. Status: completed-mvp.
38. `TASK-AT-136`: Metricas de uso dos fluxos. Status: completed-mvp.
39. `TASK-AT-137`: Scripts pessoais privados por atendente. Status: completed-mvp.
40. `TASK-AT-138`: Seletor de Fluxos por busca e dropdown. Status: completed-mvp.
41. `TASK-AT-139`: Emoji picker transversal em editores ricos. Status: completed-mvp.
42. `TASK-AT-140`: Scriptoteca - editar e reordenar pacotes. Status: completed-mvp.
43. `TASK-AT-141`: Scriptoteca - validacao runtime de inputs. Status: completed-mvp.
44. `TASK-AT-142`: Scriptoteca - regressao e stress dos pacotes. Status: completed-mvp.
45. `TASK-AT-143`: Validacao runtime residual em superficies operacionais recentes. Status: completed-mvp.
46. `TASK-AT-144`: Workbench local com indice navegavel de reports. Status: completed-mvp.
47. `TASK-AT-145`: Coverage HTML e documentacao. Status: completed-mvp.
48. `TASK-AT-148`: Integracoes externas com timeout e redaction. Status: completed-mvp.
49. `TASK-AT-146`: Anexos com remocao auditavel. Status: completed-mvp.
50. `TASK-AT-147`: Prontidao Postgres/storage externo. Status: completed-docs.
51. `TASK-AT-149`: Migracao real para Postgres. Status: blocked-external-infra-ready.
52. `TASK-AT-150`: Provider externo de storage privado. Status: completed-mvp.
53. `TASK-AT-151`: Entidade generica de anexos operacionais. Status: completed.
54. `TASK-AT-152`: Google Sheets/Drive com timeout e redaction. Status: completed.
55. `TASK-AT-153`: Scriptoteca drag/drop e versionamento de roteiros. Status: completed-mvp.

### Fase D - Cyber seguranca e exposicao externa
1. `TASK-AT-102`: Modelo de ameacas e auditoria base. Status: completed.
2. `TASK-AT-103`: Headers HTTP, CORS e perimetro web. Status: completed.
3. `TASK-AT-104`: Hardening de login, senha e sessao. Status: completed.
4. `TASK-AT-105`: Protecao CSRF e validacao de origem. Status: completed.
5. `TASK-AT-106`: Rate limit e protecao contra abuso. Status: completed.
6. `TASK-AT-107`: Validacao runtime de entrada e contratos de API. Status: completed-active-surfaces.
7. `TASK-AT-108`: Hardening de uploads e arquivos. Status: completed.
8. `TASK-AT-109`: Autorizacao, tenancy e testes anti-IDOR. Status: completed.
9. `TASK-AT-110`: Segredos, envs e deploy de producao. Status: completed.
10. `TASK-AT-111`: Auditoria, monitoramento e alertas de seguranca. Status: completed.
11. `TASK-AT-112`: Dependencias, SCA e gates no CI. Status: completed.
12. `TASK-AT-113`: Banco, backup e protecao de dados. Status: completed-docs.
13. `TASK-AT-114`: Integracoes externas, webhooks e IA. Status: completed.
14. `TASK-AT-115`: Runbook de incidente e operacao segura. Status: completed.
15. `TASK-AT-116`: Gate antes de exposicao externa. Status: completed-no-go-until-prod.

### Fase E - Onboarding e estudo do mantenedor
1. `TASK-AT-117`: TypeDoc robusto para onboarding tecnico. Status: completed.
2. `TASK-AT-118`: `npm run up` como bancada de estudo local. Status: completed.
3. `TASK-AT-119`: Deep dive de fluxos de manutencao. Status: completed.
4. `TASK-AT-120`: Checklist rapido de diagnostico. Status: completed.

### Fase F - Beta Fechado por Permissoes
1. `TASK-AT-154`: Matriz canonica de permissoes do Beta Fechado. Status: completed-mvp.
2. `TASK-AT-155`: Auditoria de rotas e telas contra matriz beta. Status: completed-mvp.
3. `TASK-AT-156`: Backend hardening por role e escopo beta. Status: completed-mvp.
4. `TASK-AT-157`: Testes negativos de permissao do beta. Status: completed-mvp.
5. `TASK-AT-158`: Frontend route guards e navegacao por role beta. Status: completed-mvp.
6. `TASK-AT-159`: Busca global escopada por permissao beta. Status: completed-mvp.
7. `TASK-AT-160`: Ranking e extratos escopados para vendedor beta. Status: completed-mvp.
8. `TASK-AT-161`: Allowlist nominal beta-local por email. Status: completed-mvp.
9. `TASK-AT-162`: Banner visual de homologacao beta-local. Status: completed-mvp.
10. `TASK-AT-163`: Seeds e usuarios controlados do beta. Status: completed-existing-seed.
11. `TASK-AT-164`: Runbook Beta Fechado via Tailscale. Status: completed-docs.
12. `TASK-AT-165`: Checklists de homologacao Beta SAC e Beta Vendedor. Status: completed-docs.
13. `TASK-AT-166`: Preflight final do beta na maquina host. Status: ready-external-host.

### Fase G - SmartScript dentro da Scriptoteca
1. `TASK-AT-168`: SmartScript - modelo de dados e permissoes. Status: completed-mvp.
2. `TASK-AT-169`: SmartScript - sanitizacao e regras de trigger. Status: completed-mvp.
3. `TASK-AT-170`: SmartScript - APIs de candidatos e revisao. Status: completed-mvp.
4. `TASK-AT-171`: SmartScript - DecisionLog e eventos auditaveis. Status: completed-mvp.
5. `TASK-AT-172`: SmartScript - aba na Scriptoteca e revisao humana. Status: completed-mvp.
6. `TASK-AT-173`: SmartScript - workspace do companion local. Status: completed-mvp.
7. `TASK-AT-174`: SmartScript - captura local por allowlist. Status: completed-mvp.
8. `TASK-AT-175`: SmartScript - processamento local e geracao de candidatos. Status: completed-mvp.
9. `TASK-AT-176`: SmartScript - importacao e rollover de Gerados hoje. Status: completed-mvp.
10. `TASK-AT-177`: SmartScript - export Espanso. Status: completed-mvp.
11. `TASK-AT-178`: SmartScript - metricas de uso e melhoria continua. Status: completed-mvp.
12. `TASK-AT-179`: SmartScript - sugestao para Scriptoteca canonica. Status: completed-mvp.
13. `TASK-AT-180`: SmartScript - regressao de seguranca e privacidade. Status: completed-mvp.
14. `TASK-AT-181`: SmartScript - runbook operacional e readiness. Status: completed-mvp.
15. `TASK-AT-182`: SmartScript - gate ponta a ponta para uso real. Status: completed-mvp.

### Fase H - SmartScript nucleo real de logging e captura
1. `TASK-AT-183`: SmartScript - contrato da captura real. Status: planned.
2. `TASK-AT-184`: SmartScript - control plane do logger local. Status: planned.
3. `TASK-AT-185`: SmartScript - resolver de contexto ativo e allowlist. Status: planned.
4. `TASK-AT-186`: SmartScript - adapter de clipboard, paste e envio. Status: planned.
5. `TASK-AT-187`: SmartScript - bridge local de eventos AlwaysChat. Status: planned.
6. `TASK-AT-188`: SmartScript - store local, TTL e retencao de raw logs. Status: planned.
7. `TASK-AT-189`: SmartScript - pipeline de eventos reais para candidatos. Status: planned.
8. `TASK-AT-190`: SmartScript - bootstrap de captura real no `npm run up`. Status: planned.
9. `TASK-AT-191`: SmartScript - observabilidade local e evidencia redigida. Status: planned.
10. `TASK-AT-192`: SmartScript - regressao de privacidade da captura real. Status: planned.
11. `TASK-AT-193`: SmartScript - gate de captura real. Status: planned.

### Fase I - CaseFlow Engine + AlwaysTrack Companion
Fonte: `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`. Status geral: planned; rodada corretiva materializada em `docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md`.

#### Fundacao corrigida
1. `TASK-AT-194`: CaseFlow: arquitetura, fronteiras e nao objetivos. Status: completed.
2. `TASK-AT-195`: Companion: spike Windows + WSL + Chrome. Status: completed.
3. `TASK-AT-196`: CaseFlow: topologia de autenticacao e confianca. Status: completed.
4. `TASK-AT-197`: Companion: threat model da extensao e host local. Status: completed.
5. `TASK-AT-198`: CaseFlow: contratos compartilhados de caso e evidencia. Status: completed.
6. `TASK-AT-199`: CaseFlow: contrato de capabilities e firewall de acao. Status: completed.
7. `TASK-AT-200`: Companion: contrato de conector consultivo. Status: completed.
8. `TASK-AT-201`: Companion: protocolo e fronteiras entre extensao, host e API. Status: completed.
9. `TASK-AT-202`: CaseFlow: scaffolding de workspaces. Status: completed.

#### Extensao Chromium
1. `TASK-AT-203`: Extensao: shell Chromium Manifest V3. Status: completed.
2. `TASK-AT-204`: Extensao: side panel shell do Copiloto SAC. Status: completed.
3. `TASK-AT-205`: Extensao: cliente de protocolo no background. Status: completed.
4. `TASK-AT-206`: Extensao: content script read-only base. Status: completed.
5. `TASK-AT-207`: Extensao: tab registry e reuso de abas. Status: completed.
6. `TASK-AT-208`: Extensao: UI de intervencao humana. Status: completed.
7. `TASK-AT-209`: Extensao: diagnostico de Chrome perfil de trabalho. Status: completed.

#### Companion Host
1. `TASK-AT-210`: Companion Host: shell Node TypeScript. Status: completed.
2. `TASK-AT-211`: Companion Host: WebSocket loopback e pairing. Status: implementation-complete-manual-gate-pending.
3. `TASK-AT-212`: Companion Host: cliente API AlwaysTrack e confianca local. Status: implementation-complete-live-gate-pending.
4. `TASK-AT-213`: Companion Host: orquestrador progressivo. Status: implementation-complete-live-gate-pending.
5. `TASK-AT-214`: Companion Host: cache, timeout e cancelamento. Status: implementation-complete-live-gate-pending.
6. `TASK-AT-215`: Companion Host: preaquecimento e saude local. Status: implementation-complete-live-gate-pending.

#### CaseFlow Core e APIs base
1. `TASK-AT-216`: CaseFlow Core: persistencia inicial. Status: completed.
2. `TASK-AT-217`: CaseFlow Core: lifecycle service. Status: completed.
3. `TASK-AT-218`: CaseFlow Core: EvidenceFact service. Status: completed.
4. `TASK-AT-219`: CaseFlow Core: conflitos e autoridade por campo. Status: completed.
5. `TASK-AT-220`: CaseFlow Core: ledger de ConnectorRun. Status: completed.
6. `TASK-AT-221`: CaseFlow Core: auditoria, retencao e redaction. Status: completed.
7. `TASK-AT-222`: CaseFlow Security: enforcement do action firewall. Status: completed.
8. `TASK-AT-223`: CaseFlow Security: regressao de acoes proibidas. Status: completed.
9. `TASK-AT-224`: CaseFlow API: casos, evidencias e conflitos. Status: completed.
10. `TASK-AT-225`: CaseFlow API: evidencia manual. Status: completed.
11. `TASK-AT-226`: CaseFlow API: resolucao manual de conflito. Status: completed.
12. `TASK-AT-227`: CaseFlow API: correcao manual de classificacao e fluxo. Status: completed.
13. `TASK-AT-228`: CaseFlow Core: desfazer overrides e metricas de correcao. Status: completed.

#### Primeira vertical AlwaysChat + Rastreio
1. `TASK-AT-229`: AlwaysChat: parser e fixture de intake. Status: completed.
2. `TASK-AT-230`: AlwaysChat: content script read-only. Status: implementation-complete-live-gate-pending.
3. `TASK-AT-231`: CaseFlow: intake ponta a ponta do caso inicial. Status: completed.
4. `TASK-AT-232`: Side panel: montar, cancelar e atualizar caso. Status: completed.
5. `TASK-AT-233`: Rastreio no Lancador: parser e fixtures. Status: completed.
6. `TASK-AT-234`: Rastreio no Lancador: runtime read-only. Status: implementation-complete-live-gate-pending.
7. `TASK-AT-235`: CaseFlow: resumo deterministico parcial. Status: completed.
8. `TASK-AT-236`: CaseFlow: shadow mode vertical simples. Status: implementation-complete-live-gate-pending.
9. `TASK-AT-237`: CaseFlow: comparacao manual no shadow mode. Status: implementation-complete-live-validation-pending.

#### Heuristica deterministica
1. `TASK-AT-238`: CaseFlow Heuristica: normalizacao textual e sinais. Status: completed.
2. `TASK-AT-239`: CaseFlow Heuristica: DSL de regras. Status: completed.
3. `TASK-AT-240`: CaseFlow Heuristica: scoring, hard rules e candidatos. Status: completed.
4. `TASK-AT-241`: CaseFlow Heuristica: baixa confianca e triagem. Status: completed.
5. `TASK-AT-242`: CaseFlow API: resolucao heuristica. Status: completed.
6. `TASK-AT-243`: CaseFlow Heuristica: golden cases. Status: completed.

#### ServiceFlow executavel e plano
1. `TASK-AT-244`: ServiceFlow: versionamento imutavel publicado. Status: completed.
2. `TASK-AT-245`: ServiceFlow: grafo, nos e transicoes. Status: completed.
3. `TASK-AT-246`: ServiceFlow: testes estruturais de grafo. Status: completed.
4. `TASK-AT-247`: CaseFlowPlan: compilador de multiplos fluxos. Status: completed.
5. `TASK-AT-248`: CaseFlowPlan: reconciliacao incremental. Status: completed.
6. `TASK-AT-249`: ServiceFlowSession: sessao presa a versao. Status: completed.
7. `TASK-AT-250`: CaseFlow API: sessoes e passos. Status: completed.
8. `TASK-AT-251`: CaseFlow API: plano compilado. Status: completed.

#### UI guiada e mensagens
1. `TASK-AT-252`: Side panel: stepper guiado operacional. Status: completed.
2. `TASK-AT-253`: Side panel: estabilidade visual da reconciliacao incremental. Status: completed.
3. `TASK-AT-254`: Side panel: fluxos detectados e razoes. Status: completed.
4. `TASK-AT-255`: Side panel: mapa de possibilidades. Status: completed.
5. `TASK-AT-256`: Side panel: ergonomia e atalhos configuraveis. Status: completed.
6. `TASK-AT-257`: Mensagens: compilador sem IA via Scriptoteca. Status: completed.
7. `TASK-AT-258`: Mensagens: politica de placeholders faltantes. Status: completed.
8. `TASK-AT-259`: Mensagens: testes estruturais e snapshots. Status: completed.
9. `TASK-AT-260`: Mensagens: saidas por canal e tipo. Status: completed.
10. `TASK-AT-261`: CaseFlow API: mensagens e copia. Status: completed.
11. `TASK-AT-262`: Side panel: acoes de copia sem escrita. Status: completed.

#### Conectores consultivos e rascunhos
1. `TASK-AT-263`: Connectors: registry runtime. Status: completed.
2. `TASK-AT-264`: Yampi: parser e fixtures. Status: completed.
3. `TASK-AT-265`: Yampi: runtime read-only. Status: implementation-complete-live-gate-pending.
4. `TASK-AT-266`: OMIE: parser base e fixtures. Status: completed.
5. `TASK-AT-267`: OMIE Filial: runtime read-only. Status: implementation-complete-live-gate-pending.
6. `TASK-AT-268`: OMIE Pharma: runtime restrito. Status: implementation-complete-live-gate-pending.
7. `TASK-AT-269`: Loggi: parser e fixtures. Status: completed.
8. `TASK-AT-270`: Loggi: runtime read-only. Status: implementation-complete-live-gate-pending.
9. `TASK-AT-271`: J&T VIP: parser e fixtures. Status: completed.
10. `TASK-AT-272`: J&T VIP: runtime read-only. Status: implementation-complete-live-gate-pending.
11. `TASK-AT-273`: Correios/Reversa: parser e fixtures. Status: completed.
12. `TASK-AT-274`: Correios/Reversa: runtime read-only. Status: implementation-complete-live-gate-pending.
13. `TASK-AT-275`: Lancador de Pedidos: parser de consulta e fixtures. Status: completed.
14. `TASK-AT-276`: Lancador de Pedidos: runtime de consulta. Status: implementation-complete-live-gate-pending.
15. `TASK-AT-277`: Slack: suporte manual por draft copiado. Status: completed.
16. `TASK-AT-278`: CaseFlow: ChatGPT fora do runtime inicial. Status: completed.
17. `TASK-AT-279`: Scriptoteca: interoperabilidade Espanso e SmartScript. Status: completed.
18. `TASK-AT-280`: AlwaysChat: inserir rascunho autorizado. Status: implementation-complete-live-gate-pending.
19. `TASK-AT-281`: Lancador de Pedidos: preparacao de rascunho. Status: implementation-complete-live-gate-pending.
20. `TASK-AT-282`: Lancador: deteccao pos-acao manual e alerta Slack. Status: implementation-complete-live-gate-pending.

#### Seguranca, performance, testes e recuperacao
1. `TASK-AT-283`: CaseFlow: testes de seguranca do protocolo local. Status: implementation-complete-manual-topology-gate-pending.
2. `TASK-AT-284`: CaseFlow: instrumentacao de SLO progressivo. Status: completed.
3. `TASK-AT-285`: CaseFlow: testes de performance, cache e concorrencia. Status: completed.
4. `TASK-AT-286`: Connectors: harness de fixtures e parser tests. Status: completed.
5. `TASK-AT-287`: Connectors: checklists de live smoke manual. Status: completed.
6. `TASK-AT-288`: Connectors: drift detection e degradacao. Status: completed.
7. `TASK-AT-289`: CaseFlow: painel de saude dos conectores. Status: completed.
8. `TASK-AT-290`: CaseFlow: metricas de sucesso do Copiloto SAC. Status: completed.
9. `TASK-AT-291`: CaseFlow: regressao anti dado cruzado. Status: completed.
10. `TASK-AT-292`: CaseFlow: E2E com paginas fake. Status: completed.
11. `TASK-AT-293`: CaseFlow: recuperacao operacional e reidratacao. Status: implementation-complete-live-recovery-gate-pending.
12. `TASK-AT-294`: Companion: instalacao, atualizacao e rollback. Status: completed.
13. `TASK-AT-295`: CaseFlow: export, backup e restore de regras, fluxos e configuracoes. Status: completed.

#### Admin, docs, demo e rollout
1. `TASK-AT-296`: AlwaysTrack Web: historico de casos CaseFlow. Status: completed.
2. `TASK-AT-297`: AlwaysTrack Web: administracao de regras heuristicas. Status: completed.
3. `TASK-AT-298`: AlwaysTrack Web: administracao de conectores e sistemas. Status: completed.
4. `TASK-AT-299`: Docs: arquitetura, API e contratos CaseFlow. Status: completed.
5. `TASK-AT-300`: Runbooks: Companion, drift e recuperacao. Status: completed.
6. `TASK-AT-301`: Demo: seeds, fixtures e roteiro guiado. Status: completed.
7. `TASK-AT-302`: Rollout: Fase 1 shadow mode gate. Status: audit-complete-no-go.
8. `TASK-AT-303`: Rollout: Fase 2 fluxo guiado gate. Status: audit-complete-no-go.
9. `TASK-AT-304`: Rollout: Fase 3 cobertura consultiva gate. Status: audit-complete-no-go.
10. `TASK-AT-305`: Rollout: Fase 4 rascunhos e rollback gate. Status: audit-complete-no-go.
11. `TASK-AT-306`: Rollout: Fase 5 hardening gate. Status: audit-complete-no-go.
12. `TASK-AT-307`: CaseFlow: prontidao para agente futuro sem implementa-lo. Status: documentation-complete-rollout-blocked.

## Frente transversal de prontidao e padronizacao (TASK-AT-308 a TASK-AT-335)

Fonte canonica: `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`.

1. `TASK-AT-308`: Prontidao: ledger canonico de cobertura, ownership e gates. Status: planned.
2. `TASK-AT-309`: Qualidade: baseline deterministico e gate verde real. Status: planned.
3. `TASK-AT-310`: Qualidade: contrato uniforme de lint, typecheck, test e build. Status: planned.
4. `TASK-AT-311`: Web: fundacao de testes unitarios e de componentes. Status: planned.
5. `TASK-AT-312`: Web e Companion: regressao de acessibilidade e teclado. Status: planned.
6. `TASK-AT-313`: E2E: matriz critica por role, viewport e jornada. Status: planned.
7. `TASK-AT-314`: UI: regressao visual e responsiva das superficies criticas. Status: planned.
8. `TASK-AT-315`: Coverage: thresholds incrementais por workspace e risco. Status: planned.
9. `TASK-AT-316`: API: OpenAPI versionado e testes de contrato HTTP. Status: planned.
10. `TASK-AT-317`: Companion: contrato de handshake, rotacao e reconexao. Status: planned.
11. `TASK-AT-318`: Extensao MV3: E2E em Chromium com Host controlado. Status: planned.
12. `TASK-AT-319`: SmartScript Companion: E2E de CLI, filesystem e Espanso. Status: planned.
13. `TASK-AT-320`: Dados: integracao production-like de Postgres, Redis e storage. Status: planned.
14. `TASK-AT-321`: Integracoes externas: matriz de contratos, sandboxes e degradacao. Status: planned.
15. `TASK-AT-322`: Robustez: property testing e fuzzing de parsers e protocolos. Status: planned.
16. `TASK-AT-323`: Performance: carga mista, stress, spike, soak e backpressure. Status: planned.
17. `TASK-AT-324`: Observabilidade: SLOs, telemetria correlacionada e alertas exercitados. Status: planned.
18. `TASK-AT-325`: Seguranca: enforcement de SAST, SCA, secrets e licencas no CI. Status: planned.
19. `TASK-AT-326`: Release: containers, artefatos e proveniencia de supply chain. Status: planned.
20. `TASK-AT-327`: Privacidade: inventario LGPD, bases legais e RIPD. Status: planned.
21. `TASK-AT-328`: Privacidade: enforcement de retencao, purge e direitos do titular. Status: planned.
22. `TASK-AT-329`: Operacao: ensaio de restore, recuperacao e rollback coordenado. Status: planned.
23. `TASK-AT-330`: Documentacao: integridade executavel de links, comandos e status. Status: planned.
24. `TASK-AT-331`: Documentacao: catalogo unico e padrao de runbooks operacionais. Status: planned.
25. `TASK-AT-332`: Runtime: readiness, shutdown gracioso e lifecycle de dependencias. Status: planned.
26. `TASK-AT-333`: Evidencias: manifesto padrao e pacote reproduzivel de apresentacao. Status: planned.
27. `TASK-AT-334`: Compatibilidade: browsers, Windows/WSL e perifericos de uso. Status: planned.
28. `TASK-AT-335`: Gate final: prontidao transversal para demo, rollout e exposicao. Status: planned.

## Runtime local e apresentacao

1. `TASK-AT-336`: Runtime local: setup inteligente e hub completo de apresentacao. Status: completed-local-validation.

## Coverage para apresentacao

Fonte canonica: `docs/tasks/COVERAGE-PRESENTATION-BACKLOG-2026-07-15.md`.

1. `TASK-AT-337`: Coverage: inventario executavel e mapa de risco por superficie. Status: completed-local-validation.
2. `TASK-AT-338`: Presentation Hub: painel comparativo de coverage. Status: completed-local-validation.
3. `TASK-AT-339`: Web coverage: primeiro marco real de 10%. Status: completed-local-validation.
4. `TASK-AT-340`: Web coverage: Scriptoteca, Wiki e Notas em 20%. Status: completed-local-validation.
5. `TASK-AT-341`: Web coverage: operacao, Fluxos e CaseFlow em 30%. Status: completed-local-validation.
6. `TASK-AT-342`: SmartScript coverage: CLI e storage atribuiveis. Status: completed-local-validation.
7. `TASK-AT-343`: Extension coverage: bootstrap e fronteiras MV3. Status: completed-local-validation.
8. `TASK-AT-344`: Shared coverage: action firewall e contratos executaveis. Status: completed-local-validation.
9. `TASK-AT-345`: API coverage: harness HTTP e funcoes de handlers. Status: completed-local-validation.
10. `TASK-AT-346`: API coverage: workflows e encerramento da excecao de funcoes. Status: planned.
11. `TASK-AT-347`: Companion Host coverage: bootstrap e branches residuais. Status: completed-local-validation.
12. `TASK-AT-348`: Coverage: gate final e ensaio da apresentacao. Status: planned.
