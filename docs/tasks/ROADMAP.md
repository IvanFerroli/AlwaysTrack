# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-05-30
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
7. `TASK-AT-023-frankenstein-ui-cleanup.md`: navegacao ativa comercial. Status: completed-partial.
8. `TASK-AT-017-danfe-structured-extraction.md`: extracao estruturada de DANFE com IA. Status: completed-mvp.
9. `TASK-AT-018-sales-document-review.md`: revisao/aprovacao MVP de notas. Status: completed-mvp.
10. `TASK-AT-019-ranking-campaigns-mvp.md`: ranking e campanhas read-only. Status: completed-partial.
11. `TASK-AT-021-sales-statements-mvp.md`: extratos JSON/CSV simples. Status: completed-partial.
12. `TASK-AT-025-sales-danfe-diagnostic-logs.md`: logs diagnosticos do fluxo DANFE. Status: completed-mvp.
13. `TASK-AT-028-danfe-deterministic-extraction.md`: extracao deterministica de DANFE PDF textual antes da IA. Status: completed-mvp.
14. `EXEC-AT-009`: filtros visuais de ranking/extratos e CSV filtrado. Status: completed.
15. `EXEC-AT-010`: extracao deterministica de XML NF-e. Status: completed.
16. `EXEC-AT-011`: planejamento da Wiki rica e tasks `AT-029` a `AT-036`. Status: completed.

## Proximas tasks recomendadas
1. `AT-029`: contrato seguro de conteudo rico da Wiki.
2. `AT-030`: editor rico/toolbar da Wiki.
3. `AT-031`: renderer bonito de documento operacional.
4. `AT-032`: imagens/anexos na Wiki.
5. `AT-018B`: editor visual de campos/itens antes da aprovacao.
6. `AT-019B`: CRUD de campanhas e snapshots.
7. `AT-014`: Google login como entrada principal.
8. `AT-026`: smoke/e2e do fluxo comercial com upload XML/PDF.
9. `AT-027`: remover/descontinuar legado SyLembra em fases.
