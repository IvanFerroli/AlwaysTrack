# Orchestrator State - AlwaysTrack Template Transition

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-05-29
- source-of-truth: docs/operations/orchestrator-state.md

## Ciclo ativo
Pipeline de transicao do repositorio AlwaysTrack (base SyLembra) para starter vertical de licencas/compliance.

Fronteira definida em: `docs/adr/ADR-002-fronteira-template-alwaystrack.md`

## Trilha de transicao (ROADMAP item ordem)
| Item | Descricao | Status |
| --- | --- | --- |
| 1 | Resolver P0 de higiene e seguranca | completed (b74975c, 8fb6957) |
| 2 | Sincronizar docs com runtime real | completed (b89fa06, bca395c, EXEC-TMP-002) |
| 3 | Definir fronteira do template | completed (ADR-002 em 1d6fa57) |
| 4 | Escolher contrato de producao banco/storage | completed (ADR-003, ADR-004 em EXEC-TMP-003) |
| 5 | Parametrizar marca, seed, tenant publico, templates | in-progress (EXEC-TMP-004: FAQ sem fallback demo-org; EXEC-TMP-006: SESSION_COOKIE_NAME parametrizado; APP_NAME por env pendente) |
| 6 | Validar em clone limpo | gate-passed (114 testes, exit 0 — EXEC-TMP-005) |

## Ultimo ciclo executado
- EXEC-TMP-006 (2026-05-29): SESSION_COOKIE_NAME ligado ao runtime de login/logout/middleware, docs/env atualizados, gate `npm run check` passou (115 testes).

## Proximo ciclo a rotar
- Decisao de produto: parametrizacao de APP_NAME por env (task propria) vs avanco direto para beta externo.
- Clone limpo real antes de qualquer convite externo ao repositorio.

## Blockers conhecidos
- Nenhum blocker tecnico critico. Decisions externas pendentes: banco/storage de producao, nivel de genericidade do template.

## Estado dos gates
| Gate | Resultado | Data |
| --- | --- | --- |
| npm run check | passou — 114 testes | 2026-05-28 |
| npm run check | passou — 115 testes | 2026-05-29 |
| npm run build --workspace @alwaystrack/web | passou | 2026-05-28 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-28 |
| npm run typecheck --workspace @alwaystrack/api | passou | 2026-05-29 |
| npm run test --workspace @alwaystrack/api | passou — 115 testes | 2026-05-29 |
| git ls-files .tmp-venv-parse/ .openclaw/ | 0 arquivos rastreados | 2026-05-28 |
| credenciais hardcoded | nenhuma encontrada | 2026-05-28 |

## Regra de precedencia aplicada
Task recebida > documento canonico > ADR > spec > task manifest > este estado.
Este arquivo nao e soberano sobre task recebida, canonico ou ADR.
