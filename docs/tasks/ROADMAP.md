# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-05-29
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

## Proximas tasks recomendadas
1. `AT-014`: Google login como entrada principal.
2. `AT-017`: extracao estruturada de DANFE.
3. `AT-018`: revisao/aprovacao de notas com edicao manual.
4. `AT-019`: motor de ranking e campanhas.
5. `AT-021`: extratos gerais, por vendedor e por grupo.
6. `AT-022`: wiki com editor rico e imagens.
7. `AT-025`: remover/descontinuar legado SyLembra em fases.
8. `AT-026`: smoke/e2e do fluxo comercial.
