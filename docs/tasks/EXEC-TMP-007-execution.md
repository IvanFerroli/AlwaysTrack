# EXEC-TMP-007 - Execution Report

## Metadata
- task-id: ROADMAP item 5 (parametrizar marca, seed, tenant publico e templates)
- execution-id: EXEC-TMP-007
- mode: runtime + build + documental
- execution-mode: execution artifact mode
- orchestrator: olympus_orchestrator
- specialist: runtime-ops
- status: executado
- date: 2026-05-29

## Sequencia operacional aplicada
1. Revisado o estado pos EXEC-TMP-006: a pendencia explicita era `APP_NAME` por env.
2. Adicionado `APP_NAME` ao contrato da API com fallback `AlwaysTrack`.
3. Adicionado `VITE_APP_NAME` ao contrato web para marca visivel, `document.title`, title do HTML e manifest.
4. Substituido `site.webmanifest` estatico por manifest gerado pelo Vite com o nome configurado.
5. Ajustadas mensagens pontuais da API que expunham nome de app: callback Google, FAQ/wa.me e importador guiado.
6. Atualizados `.env.example`, `scripts/check-env.js`, runbooks, ROADMAP e orchestrator-state.

## Artefatos materiais
1. `services/api/src/config/env.ts` - `appName`.
2. `apps/web/src/main.tsx` - `VITE_APP_NAME` aplicado na UI.
3. `apps/web/vite.config.ts` - title HTML e manifest gerados com `VITE_APP_NAME`.
4. `services/api/src/core/integrations/google/google.handlers.ts` - callback Google usa `appName`.
5. `services/api/src/core/faq/faq.service.ts` e importador - mensagens operacionais usam `appName`.

## Evidencias observaveis
- `npm run typecheck --workspace @alwaystrack/api` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- `APP_NAME=OpsCore VITE_APP_NAME=OpsCore npm run build --workspace @alwaystrack/web` passou e gerou `title`/manifest com `OpsCore`.
- `npm run test --workspace @alwaystrack/api` passou: 23 arquivos, 116 testes.
- `npm run check` passou: lint, typecheck dos workspaces e 116 testes.

## Estado da parametrizacao apos este ciclo
| Item | Estado |
| --- | --- |
| Seed demo | Parametrizado via env vars existentes |
| FAQ publica org default | Sem fallback para demo-org desde EXEC-TMP-004 |
| Cookie de sessao | Parametrizado via `SESSION_COOKIE_NAME` desde EXEC-TMP-006 |
| Nome do app API | Parametrizado via `APP_NAME` |
| Nome do app web/title/manifest | Parametrizado via `VITE_APP_NAME` |

## Limites mantidos
Templates demo e scripts historicos continuam com copy AlwaysTrack quando representam conteudo seedado ou log operacional do proprio repositorio. Trocar essa camada exigiria uma task de rebrand de dados/demo, fora do escopo minimo deste ciclo.
