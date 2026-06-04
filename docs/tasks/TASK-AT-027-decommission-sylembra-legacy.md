# TASK-AT-027 - Remover/descontinuar legado SyLembra em fases

## Metadata
- status: completed-partial
- owner: product-builder
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-027-decommission-sylembra-legacy.md

## Objetivo
Descontinuar o legado SyLembra/licencas/compliance sem quebrar o produto comercial ativo do AlwaysTrack.

## Escopo priorizado
1. Remover copy legado ainda visivel em UI ativa.
2. Tirar seed/login/docs de uso do recorte de licencas/compliance.
3. Isolar ou desativar rotas expostas que pertencem ao vertical antigo.
4. Preservar historico em `docs/archive/sylembra/` sem reabrir backlog antigo.

## Mapa de residuos em 2026-06-03
- UI ativa: login ainda tinha copy de "licencas e documentos"; ajustado em `apps/web/src/main.tsx`.
- UI nao navegavel: componentes `ProfessionalsView`, `LicensesView`, `DocumentsView`, `ReportsView`, `SettingsView` continuam no bundle, mas nao aparecem em `navItems`.
- Ajuda: `HelpView` ainda documenta profissionais, licencas, documentos, upload publico, notificacoes e relatorios antigos; hoje nao aparece no menu porque `help` nao entra em `visibleNav`, mas os textos seguem no codigo.
- API: rotas autenticadas de profissionais, licencas, documentos antigos, notificacoes de licenca e relatorios antigos ficaram atras de `ENABLE_LEGACY_SYLEMBRA=true`.
- API publica: rotas antigas de upload publico, FAQ publica e help publico tambem ficaram atras de `ENABLE_LEGACY_SYLEMBRA=true`.
- Seed local: `services/api/prisma/seed.ts` ainda cria RT, supervisor, unidade/setor, profissionais, licencas, documentos, templates/regras de notificacao e jobs do dominio antigo, alem do seed comercial.
- Flush local: `scripts/flush-local-demo.js` mantem templates/regras de notificacao de licencas e fallback `FLUSH_DEMO_*`; `package.json` ainda tem alias `db:flush:demo`.
- Jobs/scripts: `package.json` e `services/api/package.json` ainda expõem `job:notifications`; `services/api/src/jobs/notifications.ts` segue ativo.
- Docs operacionais: `docs/runbooks/RUNBOOK-001-ambiente-local.md` ainda documenta alias/fallback legado por compatibilidade.

## Plano em fases
1. Fase UI/copy: remover ou reescrever `HelpView` antigo e retirar branches legadas de render quando nao houver rota de acesso.
2. Fase seed/demo: fazer `seed.ts` produzir somente usuarios, grupos, vendedores, notas, campanhas e wiki comercial; mover fixtures de licenca para arquivo arquivado ou seed opt-in.
3. Fase API: colocar rotas antigas atras de flag temporaria ou remover handlers apos atualizar testes e smoke.
4. Fase schema/job: decidir se tabelas Prisma antigas ficam como historico tecnico, migracao de remocao futura ou modulo opt-in.
5. Fase docs/scripts: remover `db:flush:demo`, `FLUSH_DEMO_*` e `job:notifications` quando nao houver consumidor ativo.

## Entregue nesta rodada
- Copy do login alterado para notas, ranking, campanhas e extratos comerciais.
- Manifesto PWA alterado para operacao comercial, sem licencas/notificacoes como promessa principal.
- `ENABLE_LEGACY_SYLEMBRA` criado no ambiente da API e documentado no `.env.example` como desligado por padrao.
- Rotas autenticadas do vertical antigo colocadas atras da flag de legado.
- Rotas publicas antigas de upload/FAQ/help colocadas atras da flag de legado.
- Rotas da Wiki deixaram de aceitar `RT` como papel comercial ativo por padrao.

## Criterios de aceite
- Login, navegacao e docs de uso nao mencionam licencas, RT, COREN, vencimentos, regularizacao ou profissionais como operacao principal.
- `npm run setup` cria uma demo comercial coerente sem dados de compliance.
- Smoke comercial cobre login, dashboard, notas, campanhas, ranking, extratos e wiki sem depender de entidades legadas.
- Rotas legadas nao ficam acessiveis por padrao em ambiente comercial.

## Riscos de regressao
- Remover rotas antigas antes de atualizar testes pode quebrar suites de dashboard, reports, documents, notifications e qualidade.
- Remover seed legado sem ajustar smoke/testes pode deixar usuarios `RT`/`SUPERVISOR` e escopos antigos sem fixture.
- Desativar upload publico antigo pode afetar handlers compartilhados com storage/documentos se nao houver separacao clara de anexos comerciais/wiki.
