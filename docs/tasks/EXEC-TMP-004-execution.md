# EXEC-TMP-004 - Execution Report

## Metadata
- task-id: ROADMAP item 5 (parametrizar marca, seed, tenant publico e templates)
- execution-id: EXEC-TMP-004
- mode: runtime + documental
- execution-mode: execution artifact mode
- orchestrator: olympus_orchestrator
- specialist: runtime-ops
- status: executado
- date: 2026-05-28

## Sequencia operacional aplicada
1. Mapeado estado atual de parametrizacao: seed ja usa env vars (SEED_*); flush-local-demo.js ja e anonimo; templates WhatsApp ja usam copy AlwaysTrack.
2. Identificado bloqueador remanescente: FAQ publica usa `demo-org` como fallback hardcoded quando nao ha `organizationId` no query param.
3. Corrigido PublicFaqView em apps/web/src/main.tsx: sem `organizationId` na URL, a pagina exibe erro explicito em vez de silenciosamente carregar dados do tenant demo.
4. Atualizado ROADMAP item 5 com status de parametrizacao atual.
5. Atualizado orchestrator-state.
6. npm run typecheck --workspace @alwaystrack/web passou.

## Artefatos materiais
1. apps/web/src/main.tsx — PublicFaqView: organizationId nao faz mais fallback para "demo-org"
2. docs/tasks/ROADMAP.md — item 5 atualizado
3. docs/operations/orchestrator-state.md — estado atualizado

## Evidencias observaveis
- npm run typecheck --workspace @alwaystrack/web passou sem erros
- PublicFaqView: `params.get("organizationId") ?? null` em vez de `|| "demo-org"`
- Loading e erro inicializados condicionalmente: loading=false e erro explicito quando sem organizationId

## Estado da parametrizacao apos este ciclo
| Item | Estado |
| --- | --- |
| Seed demo (prisma/seed.ts) | Parametrizado: usa SEED_* env vars; dados anonimos (example.com, zeros de CPF) |
| flush-local-demo.js | Parametrizado: usa FLUSH_DEMO_* env vars; senha aleatoria se ausente |
| Templates WhatsApp | Copy AlwaysTrack desde c4f9926 |
| FAQ publica org default | Corrigido: sem fallback para demo-org |
| Onboarding de tenant | Pendente: nao existe rota de criacao de nova organizacao; seed/estado preexistente obrigatorio |
| Variavel de marca/app | Parcialmente feito: title, manifest, cookie ja sao AlwaysTrack; parametrizacao por env nao implementada |

## Blockers
Parametrizacao completa de marca por env (APP_NAME, APP_COOKIE, APP_MANIFEST) nao foi implementada — exige task propria de scaffolding/contracts. Documentado como proximo passo.

## Nota para proximo ciclo
Proximo: EXEC-TMP-005 — ROADMAP item 6: validar em clone limpo.
