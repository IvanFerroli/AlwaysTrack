# Matriz E2E critica por papel

## Metadata
- status: active
- owner: olympus_runtime_builder
- last-updated: 2026-07-15
- source-of-truth: docs/testing/e2e-critical-role-matrix.md

## Politica de execucao
A camada API prova autorizacao e CaseFlow para todos os papeis. A camada browser cobre a jornada de maior risco de cada papel sem repetir a navegacao ampla do smoke. Todos os dados sao sinteticos e recriados em SQLite temporario.

| Papel | Viewport de risco | Jornada positiva | Guarda negativa | Arquivo |
| --- | --- | --- | --- | --- |
| ADMIN | Desktop Chrome | historico, regras, conectores, backup, retry e saude CaseFlow | falha transitoria recupera; restore JSON invalido falha fechado | `critical-role.desktop.spec.ts` |
| GESTOR | Desktop Chrome | metricas redigidas de saude CaseFlow | configuracao CaseFlow administrativa retorna 403 | `critical-role.desktop.spec.ts` |
| SAC | Pixel 5 | Fluxos e Scriptoteca operacionais | vendas, saude gerencial e admin ausentes/403 | `critical-role.mobile.spec.ts` |
| FINANCEIRO | Desktop Chrome | consulta de DANFEs | criacao de campanha retorna 403 | `critical-role.desktop.spec.ts` |
| VENDEDOR | Pixel 5 | notas e ranking no proprio escopo | usuarios e superficies gerenciais ausentes/403 | `critical-role.mobile.spec.ts` |
| SUPERVISOR | Desktop Chrome | monitoramento de ranking e documentos | revisao de DANFE e CaseFlow gerencial bloqueados | `critical-role.desktop.spec.ts` |

## CaseFlow compartilhado
`critical-role-caseflow.api.spec.ts` cria e le um caso sintetico por papel. ADMIN consulta o historico administrativo e recebe erro deterministico para payload invalido. Os demais papeis recebem 403 no historico administrativo; GESTOR tambem prova acesso permitido a health/success, e SAC prova acesso permitido a conhecimento com bloqueio de vendas e diagnosticos.

## Viewports
- Desktop: `Desktop Chrome`, adequado a tabelas administrativas, diagnosticos, revisao financeira e monitoramento.
- Mobile: `Pixel 5`, adequado ao uso de campo do SAC e VENDEDOR.
- Os arquivos `*.desktop.spec.ts` e `*.mobile.spec.ts` sao ignorados pelo projeto oposto; nao ha lancamento de browser para um skip de viewport.

## Dados e artefatos
- Contas base: seed local `admin`, `sac`, `financeiro`, `vendedor` e `supervisor`.
- GESTOR: usuario SAC sintetico promovido via API administrativa dentro do banco temporario.
- Segredos externos, cookies exportados, PII e sistemas live: proibidos.
- Trace, screenshot e video: somente em falha, sob `test-results/e2e-artifacts` e `playwright-report` ignorados pelo Git.

## Evidencia de 2026-07-15
- API/CaseFlow: 6 testes passaram, evidencia `local/fake`.
- Browser desktop/mobile: 6 testes passaram em Chromium com bibliotecas NSS/NSPR extraidas em diretorio temporario, sem instalacao privilegiada.
- Total da matriz critica: 12/12 testes passaram; a jornada GESTOR tambem passou isoladamente para provar o host de API configuravel.
- Esta evidencia nao e production-like nem live e nao autoriza rollout.
