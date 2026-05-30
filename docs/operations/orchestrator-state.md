# Orchestrator State - AlwaysTrack Product Buildout

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-05-30
- source-of-truth: docs/operations/orchestrator-state.md

## Ciclo ativo
Buildout do produto AlwaysTrack como ferramenta comercial para empresa de suplementos: upload de DANFE por vendedor, extracao, ranking, campanhas, dashboard e extratos.

Fronteira definida em: `docs/adr/ADR-002-fronteira-template-alwaystrack.md`

## Trilha concluida de transicao (ROADMAP item ordem)
| Item | Descricao | Status |
| --- | --- | --- |
| 1 | Resolver P0 de higiene e seguranca | completed (b74975c, 8fb6957) |
| 2 | Sincronizar docs com runtime real | completed (b89fa06, bca395c, EXEC-TMP-002) |
| 3 | Definir fronteira do template | completed (ADR-002 em 1d6fa57) |
| 4 | Escolher contrato de producao banco/storage | completed (ADR-003, ADR-004 em EXEC-TMP-003) |
| 5 | Parametrizar marca, seed, tenant publico, templates | completed para a fronteira atual (EXEC-TMP-004, EXEC-TMP-006, EXEC-TMP-007) |
| 6 | Validar em clone limpo | completed (EXEC-TMP-008: git clone + npm install + npm run setup + npm run check) |

## Ultimo ciclo executado
- EXEC-AT-009 (2026-05-30): filtros visuais de ranking/extratos comerciais e CSV filtrado.

## Proximo ciclo a rotar
- Implementar Google login como entrada principal.
- Implementar editor visual de campos/itens extraidos antes da aprovacao.
- Implementar XML NF-e como caminho deterministico preferencial.
- Implementar CRUD de campanhas e snapshots de ranking.
- Implementar consolidacoes de extratos comerciais por vendedor/grupo.
- Implementar wiki com editor rico e imagens.
- Remover/descontinuar legado SyLembra em fases.
- Se houver beta externo, acompanhar o residual `npm audit` moderado em `exceljs`/`uuid` ate haver upgrade seguro de upstream.
- Evitar reabrir tasks de licencas/compliance como backlog AlwaysTrack.

## Blockers conhecidos
- Nenhum blocker tecnico critico. Residual conhecido: legado SyLembra ainda existe no codigo como porao tecnico temporario; UI ativa ja aponta para o produto comercial.

## Estado dos gates
| Gate | Resultado | Data |
| --- | --- | --- |
| npm run check | passou — 114 testes | 2026-05-28 |
| npm run check | passou — 115 testes | 2026-05-29 |
| npm run check | passou — 116 testes | 2026-05-29 |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-TMP-009) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-001) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-002) |
| npm run check | passou — 116 testes | 2026-05-29 (EXEC-AT-003) |
| npm run check | passou — 124 testes | 2026-05-29 (EXEC-AT-004) |
| npm run check | passou — 125 testes | 2026-05-29 (EXEC-AT-005) |
| npm run check | passou — 129 testes | 2026-05-29 (EXEC-AT-006) |
| main operational flow e2e | ampliado — evidencia auditoria/upload/notificacao | 2026-05-29 (EXEC-AT-003) |
| clone limpo: git clone + npm install + npm run setup + npm run check | passou — 116 testes | 2026-05-29 |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-28 |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-003) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-004) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-005) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-29 (EXEC-AT-006) |
| APP_NAME=OpsCore VITE_APP_NAME=OpsCore npm run build --workspace @alwaystrack/web | passou | 2026-05-29 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-28 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-29 |
| npm run test --workspace @alwaystrack/api | passou — 115 testes | 2026-05-29 |
| npm audit --omit=dev | residual — 2 moderadas via exceljs/uuid | 2026-05-29 |
| env:check --production com URLs publicas e secret forte | passou | 2026-05-29 |
| env:check --production com secret curto / localhost / loopback | falhou como esperado | 2026-05-29 |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-001) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-002) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-003) |
| npm run env:check | passou | 2026-05-29 (EXEC-AT-004) |
| npm run setup | passou — seed local aplicado | 2026-05-29 (EXEC-AT-002) |
| npm run setup | passou — wiki migration e seed local aplicados | 2026-05-29 (EXEC-AT-004) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/wiki | 2026-05-29 (EXEC-AT-005) |
| npm run setup | passou — sales migration e seed comercial aplicados | 2026-05-29 (EXEC-AT-006) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard comercial/notas/wiki | 2026-05-29 (EXEC-AT-006) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-007) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-007) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 8 testes | 2026-05-30 (EXEC-AT-007) |
| npm run check | passou — 133 testes | 2026-05-30 (EXEC-AT-007) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-007) |
| npm run smoke:beta-local | passou — dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-007) |
| GitHub Actions check.yml | versionado — npm ci + setup + check | 2026-05-29 |
| docs/tasks sem manifests historicos TASK-* | passou — 58 tasks arquivadas em docs/archive/sylembra/tasks/ | 2026-05-29 |
| trilha TASK-AT inicial | criada — baseline + runtime copy/seed cleanup | 2026-05-29 |
| contrato seed local | alias db:flush:local + fallback legado FLUSH_DEMO_* | 2026-05-29 |
| wiki MVP | schema + API + UI /wiki + service tests | 2026-05-29 (EXEC-AT-004) |
| beta readiness gate | documentado em docs/operations/beta-readiness-gate-2026-05-29.md | 2026-05-29 (EXEC-AT-004) |
| wiki hardening | comparacao + rascunho local + preview admin | 2026-05-29 (EXEC-AT-005) |
| dashboard action center | metricas/filas wiki e atalhos operacionais | 2026-05-29 (EXEC-AT-005) |
| pivot comercial | roles + schema vendas + upload DANFE + UI ativa comercial | 2026-05-29 (EXEC-AT-006) |
| DANFE comercial | extracao IA + revisao MVP + ranking/campanhas read-only + extratos | 2026-05-30 (EXEC-AT-007) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-008) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-008) |
| npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts | passou — 10 testes | 2026-05-30 (EXEC-AT-008) |
| npm run check | passou — 135 testes | 2026-05-30 (EXEC-AT-008) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-008) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-008) |
| PDF real DANFE textual | passou — 28 DANFEs completas via deterministic-pdf-text, sem IA | 2026-05-30 (EXEC-AT-008) |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-30 (EXEC-AT-009) |
| npm run typecheck --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-009) |
| npm run check | passou — 135 testes | 2026-05-30 (EXEC-AT-009) |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-30 (EXEC-AT-009) |
| npm run smoke:beta-local | passou — env/setup/login/dashboard/notas/campanhas/ranking/extratos/wiki | 2026-05-30 (EXEC-AT-009) |
| git ls-files .tmp-venv-parse/ .openclaw/ | 0 arquivos rastreados | 2026-05-28 |
| credenciais hardcoded | nenhuma encontrada | 2026-05-28 |

## Regra de precedencia aplicada
Task recebida > documento canonico > ADR > spec > task manifest > este estado.
Este arquivo nao e soberano sobre task recebida, canonico ou ADR.
