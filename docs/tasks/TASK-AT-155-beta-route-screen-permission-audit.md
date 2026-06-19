# TASK-AT-155 - Auditoria de rotas e telas contra matriz beta

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-155-beta-route-screen-permission-audit.md

## Modo
- mode: audit

## Objetivo unico
Auditar rotas backend, views frontend, menus e busca global contra a matriz canonica do beta.

## Contexto minimo
Antes de endurecer permissao, e necessario saber onde o sistema ja respeita roles e onde apenas assume acesso amplo. O risco principal e esconder menu sem bloquear endpoint.

## Inputs
- `TASK-AT-154`.
- `services/api/src/app.ts`.
- Views em `apps/web/src/views`.

## Dependencias
- satisfeitas: `TASK-AT-154`.
- em aberto: matriz final precisa estar criada.

## Alvos explicitos
1. `services/api/src/app.ts`
2. `apps/web/src`
3. `services/api/src/core/search`
4. `docs/security/commercial-permission-matrix.md`

## Fora de escopo
- Corrigir permissao.
- Criar testes.

## Checklist
1. Listar todas as rotas comerciais/conhecimento/admin.
2. Registrar `requireRole` atual por rota.
3. Mapear telas/sidebar/topbar por role.
4. Mapear resultados possiveis da busca global.
5. Identificar gaps SAC e VENDEDOR.
6. Priorizar riscos por vazamento comercial/admin.

## Acceptance Criteria
1. Existe uma tabela rota -> role atual -> role esperada -> status.
2. Existe uma tabela tela/menu -> role atual -> role esperada -> status.
3. Busca global tem gaps de escopo documentados.
4. Endpoints de maior risco estao priorizados.

## Definition of Done
1. Auditoria registrada em doc ou task.
2. Lista objetiva de ajustes para backend/frontend/busca.

## Validacao
- comandos/checks: `rg requireRole services/api/src/app.ts`, leitura das views.
- revisao manual: confrontar com `TASK-AT-154`.

## Evidencia esperada
- Matriz de gaps.
- Lista de rotas/telas bloqueadoras para beta.

## Riscos
- Ignorar rota secundaria que ainda vaza dado.
- Confundir permissao de UI com permissao real.

## Blockers possiveis
- `TASK-AT-154` incompleta.

## Retorno esperado
- resumo curto dos gaps
- rotas/telas prioritarias
- riscos ou ressalvas
- proximo passo recomendado
