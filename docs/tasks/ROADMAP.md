# Task Roadmap

## Metadata
- status: active-product
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/ROADMAP.md

## Objetivo
Manter somente o plano ativo do AlwaysTrack. Material de produto anterior fica arquivado e nao deve ser lido como backlog atual.

## Trilha concluida - transicao para template
1. Resolver P0 de higiene e seguranca apontados em `docs/operations/auditoria-estado-atual-template-2026-05-27.md`. Status: completed em `b74975c` e `8fb6957`.
2. Sincronizar intake, runbooks e roadmap com o runtime real. Status: completed. Commits: `b89fa06` (intake/runbooks), `bca395c` (env.example IA + adendos pos-V1), `EXEC-TMP-002` (status tasks + provider Gemini).
3. Definir fronteira do template: starter de licencas/compliance, base operacional generica ou produto AlwaysTrack ja rebrandado. Status: accepted em `docs/adr/ADR-002-fronteira-template-alwaystrack.md`.
4. Escolher contrato de producao para banco e storage antes de prometer beta fora de ambiente controlado. Status: accepted em `docs/adr/ADR-003-contrato-banco-producao.md` e `docs/adr/ADR-004-contrato-storage-producao.md`.
5. Parametrizar marca, seed, tenant publico e templates apos a decisao de fronteira. Status: completed para a fronteira atual. Seed e flush-local-demo ja usam env vars; FAQ publica sem fallback demo-org (EXEC-TMP-004); SESSION_COOKIE_NAME parametrizado na API (EXEC-TMP-006); APP_NAME/VITE_APP_NAME parametrizam API, UI, titulo e manifest web (EXEC-TMP-007).
6. Validar em clone limpo com `npm install`, `npm run setup` e `npm run check`. Status: completed em EXEC-TMP-008: clone limpo real passou com 116 testes.

## Trilha atual - produto AlwaysTrack
1. `TASK-AT-001-product-baseline-alwaystrack.md`: declarar baseline de produto, vocabulario canonico e nao-escopo. Status: completed em `EXEC-AT-001`.
2. `TASK-AT-002-runtime-copy-seed-cleanup.md`: remover ruido publico V1/demo herdado em UI, seed local e docs operacionais. Status: completed em `EXEC-AT-001`.
3. `TASK-AT-003-local-seed-contract.md`: consolidar seed local como contrato explicito, com alias/comandos e compatibilidade. Status: completed em `EXEC-AT-002`.
4. `TASK-AT-004-first-operator-flow.md`: consolidar fluxo organizacao -> profissional -> licenca -> documento -> notificacao/relatorio. Status: completed em `EXEC-AT-003`.
5. `TASK-AT-005-beta-readiness-gate.md`: checklist e validacao para beta externo controlado. Status: completed em `EXEC-AT-004`.
6. `TASK-AT-006-wiki-collaborative-review-flow.md`: wiki em `/wiki`, edicoes com moderacao admin e indicadores de leitura/presenca. Status: completed-mvp em `EXEC-AT-004`.
7. `TASK-AT-007-wiki-review-hardening.md`: comparacao de revisoes, rascunho local e preview de moderacao. Status: completed em `EXEC-AT-005`.
8. `TASK-AT-008-dashboard-action-center.md`: dashboard como central de acoes com pendencias wiki. Status: completed em `EXEC-AT-005`.
9. `TASK-AT-009-regularization-workflow.md`: acompanhamento de casos de regularizacao por licenca/documento. Status: proposed.
10. `TASK-AT-010-compliance-dossier-export.md`: dossie de compliance exportavel por profissional/licenca. Status: proposed.
11. `TASK-AT-011-beta-local-smoke.md`: smoke local automatizado para beta controlado. Status: completed em `EXEC-AT-005`.

## Estado atual
A trilha de produto AlwaysTrack foi aberta sobre a fronteira aceita em ADR-002. O trabalho ativo agora deve construir o starter vertical de licencas/compliance, sem reabrir backlog SyLembra. Proximas paredes provaveis: workflow de regularizacao e dossie de compliance exportavel.

## Arquivo historico
As tasks `TASK-*` da V1 SyLembra foram movidas para `docs/archive/sylembra/tasks/`.

Use esses arquivos apenas para auditoria, rastreio de decisao ou consulta de implementacao ja entregue. Para nova execucao, criar task nova em `docs/tasks/` com escopo AlwaysTrack atual.
