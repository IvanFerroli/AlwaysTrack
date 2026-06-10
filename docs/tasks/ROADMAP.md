# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-06-10
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

## Proximas tasks recomendadas
1. `TASK-AT-049-playwright-e2e-regression-suite.md`: completar fluxos de navegador para upload/review DANFE e review Wiki.
2. `TASK-AT-052-bullmq-background-jobs-backpressure.md`: validar BullMQ com Redis real em stage/CI dedicado.
3. `TASK-AT-054-code-hardening-modularization-rounds.md`: extrair Notas/Wiki/Usuarios ou outras views por dominio de `apps/web/src/main.tsx`.
4. `TASK-AT-053-observability-profiling-and-query-optimization.md`: aplicar otimizacao comprovada por metricas.
5. `TASK-AT-051-load-performance-1000-users-gate.md`: rodar `perf:1000` em stage/producao-like e produzir relatorio.
