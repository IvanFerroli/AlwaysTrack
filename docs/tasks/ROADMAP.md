# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-06-03
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
11. `TASK-AT-021-sales-statements-mvp.md`: extratos JSON/CSV simples. Status: completed-partial.
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

## Proximas tasks recomendadas
1. `AT-014`: Google login como entrada principal.
2. `AT-026`: smoke/e2e do fluxo comercial com upload XML/PDF.
3. `AT-027B`: seed comercial sem fixtures SyLembra, help comercial e rotas publicas antigas opt-in/removidas.
4. `AT-019C`: filtro visual por vendedor no ranking e comparacao de snapshots.
