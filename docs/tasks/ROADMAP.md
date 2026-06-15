# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-06-13
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
4. `TASK-AT-024-commercial-users-teams-seed.md`: seed comercial de usuarios, vendedor e time. Status: completed-partial.
5. `TASK-AT-016-seller-danfe-upload.md`: upload autenticado de DANFE. Status: completed-mvp.
6. `TASK-AT-020-commercial-dashboard-initial.md`: dashboard comercial inicial. Status: completed-partial.
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
58. `EXEC-AT-053`: regressao Playwright de navegador para upload/aprovacao DANFE e review Wiki com comentario (`TASK-AT-049`). Status: completed-partial.
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

## Proximas tasks recomendadas
1. `TASK-AT-102-security-threat-model-and-baseline-audit.md`: Modelo de ameacas e auditoria base da fase de seguranca. Primeira task recomendada antes de qualquer implementacao.
2. `TASK-AT-103-http-security-headers-cors-perimeter.md`: Headers HTTP, CORS e perimetro web.
3. `TASK-AT-104-auth-session-and-login-hardening.md`: Hardening de login, senha e sessao.
4. `TASK-AT-105-csrf-origin-protection-for-cookie-api.md`: Protecao CSRF e validacao de origem.
5. `TASK-AT-106-rate-limit-and-abuse-protection.md`: Rate limit e protecao contra abuso.
6. `TASK-AT-101-rich-image-attachments-across-content.md`: Anexos de imagem transversais em Wiki, FAQ, Avisos e Scriptoteca. Backlog, nao executar sem nova ordem.
7. `TASK-AT-074-final-visual-polish-by-real-screenshots.md`: Polimento visual final por prints reais. Fase A, prioridade 6, bloqueada ate prints.

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
5. `TASK-AT-074`: Polimento visual final por prints reais. Status: proposed-blocked-by-user-input.

### Fase B - Confiabilidade operacional
1. `TASK-AT-073`: Diagnostico de DANFE e correcao manual auditavel. Status: completed-mvp.
2. `TASK-AT-075`: Playwright/CI limpo. Status: proposed.
3. `TASK-AT-076`: Paginacao server-side em telas criticas. Status: proposed.
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
24. `TASK-AT-101`: Anexos de imagem transversais em conteudo operacional. Status: proposed-backlog.

### Fase D - Cyber seguranca e exposicao externa
1. `TASK-AT-102`: Modelo de ameacas e auditoria base. Status: proposed.
2. `TASK-AT-103`: Headers HTTP, CORS e perimetro web. Status: proposed.
3. `TASK-AT-104`: Hardening de login, senha e sessao. Status: proposed.
4. `TASK-AT-105`: Protecao CSRF e validacao de origem. Status: proposed.
5. `TASK-AT-106`: Rate limit e protecao contra abuso. Status: proposed.
6. `TASK-AT-107`: Validacao runtime de entrada e contratos de API. Status: proposed.
7. `TASK-AT-108`: Hardening de uploads e arquivos. Status: proposed.
8. `TASK-AT-109`: Autorizacao, tenancy e testes anti-IDOR. Status: proposed.
9. `TASK-AT-110`: Segredos, envs e deploy de producao. Status: proposed.
10. `TASK-AT-111`: Auditoria, monitoramento e alertas de seguranca. Status: proposed.
11. `TASK-AT-112`: Dependencias, SCA e gates no CI. Status: proposed.
12. `TASK-AT-113`: Banco, backup e protecao de dados. Status: proposed.
13. `TASK-AT-114`: Integracoes externas, webhooks e IA. Status: proposed.
14. `TASK-AT-115`: Runbook de incidente e operacao segura. Status: proposed.
15. `TASK-AT-116`: Gate antes de exposicao externa. Status: proposed.

### Fase E - Onboarding e estudo do mantenedor
1. `TASK-AT-117`: TypeDoc robusto para onboarding tecnico. Status: completed.
2. `TASK-AT-118`: `npm run up` como bancada de estudo local. Status: completed.
3. `TASK-AT-119`: Deep dive de fluxos de manutencao. Status: completed.
