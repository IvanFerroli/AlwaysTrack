# Task Roadmap

## Metadata
- status: active-transition
- owner: task-planner
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/ROADMAP.md

## Objetivo
Manter somente o plano ativo do AlwaysTrack. Material de produto anterior fica arquivado e nao deve ser lido como backlog atual.

## Trilha atual - transicao para template
1. Resolver P0 de higiene e seguranca apontados em `docs/operations/auditoria-estado-atual-template-2026-05-27.md`. Status: completed em `b74975c` e `8fb6957`.
2. Sincronizar intake, runbooks e roadmap com o runtime real. Status: completed. Commits: `b89fa06` (intake/runbooks), `bca395c` (env.example IA + adendos pos-V1), `EXEC-TMP-002` (status tasks + provider Gemini).
3. Definir fronteira do template: starter de licencas/compliance, base operacional generica ou produto AlwaysTrack ja rebrandado. Status: accepted em `docs/adr/ADR-002-fronteira-template-alwaystrack.md`.
4. Escolher contrato de producao para banco e storage antes de prometer beta fora de ambiente controlado. Status: accepted em `docs/adr/ADR-003-contrato-banco-producao.md` e `docs/adr/ADR-004-contrato-storage-producao.md`.
5. Parametrizar marca, seed, tenant publico e templates apos a decisao de fronteira. Status: completed para a fronteira atual. Seed e flush-local-demo ja usam env vars; FAQ publica sem fallback demo-org (EXEC-TMP-004); SESSION_COOKIE_NAME parametrizado na API (EXEC-TMP-006); APP_NAME/VITE_APP_NAME parametrizam API, UI, titulo e manifest web (EXEC-TMP-007).
6. Validar em clone limpo com `npm install`, `npm run setup` e `npm run check`. Status: completed em EXEC-TMP-008: clone limpo real passou com 116 testes.

## Estado atual
A trilha de transicao esta concluida para a fronteira aceita em ADR-002. O proximo passo nao e continuar a lista antiga da SyLembra; e uma decisao de produto:
- avancar para beta externo;
- abrir novo ciclo de produto AlwaysTrack;
- extrair outro starter com escopo diferente.

## Arquivo historico
As tasks `TASK-*` da V1 SyLembra foram movidas para `docs/archive/sylembra/tasks/`.

Use esses arquivos apenas para auditoria, rastreio de decisao ou consulta de implementacao ja entregue. Para nova execucao, criar task nova em `docs/tasks/` com escopo AlwaysTrack atual.
