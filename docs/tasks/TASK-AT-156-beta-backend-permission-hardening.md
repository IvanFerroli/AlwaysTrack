# TASK-AT-156 - Backend hardening por role e escopo beta

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-156-beta-backend-permission-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Endurecer autorizacao backend para que SAC, VENDEDOR, FINANCEIRO, SUPERVISOR, GESTOR e ADMIN respeitem a matriz beta em rotas e escopos de dados.

## Contexto minimo
O frontend nao e fonte de verdade. Usuarios devem ser bloqueados mesmo tentando URL/manual request. O beta exige que SAC nao acesse comercial/admin e VENDEDOR nao acesse dados de terceiros.

## Inputs
- `TASK-AT-154`.
- `TASK-AT-155`.

## Dependencias
- satisfeitas: matriz e auditoria.
- em aberto: gaps priorizados.

## Alvos explicitos
1. `services/api/src/app.ts`
2. `services/api/src/core/auth`
3. `services/api/src/core/sales-documents`
4. `services/api/src/core/search`
5. `packages/shared/src/index.ts`

## Fora de escopo
- Alterar menus frontend.
- Criar banner beta.
- Criar allowlist.

## Checklist
1. Ajustar `requireRole` das rotas conforme matriz.
2. Garantir SAC fora de notas/ranking/extratos/campanhas/usuarios/config/auditoria/integracoes.
3. Garantir VENDEDOR apenas com proprios documentos, proprio extrato e proprio desempenho.
4. Remover revisao de notas para SUPERVISOR durante beta.
5. Garantir FINANCEIRO sem governanca de campanhas.
6. Preservar ADMIN total.
7. Preservar GESTOR em operacao ampla/campanhas/governanca onde definido.

## Acceptance Criteria
1. SAC recebe 403 em endpoints comerciais/admin.
2. VENDEDOR recebe 403/404 ao tentar acessar documento/extrato/ranking identificavel de terceiros.
3. SUPERVISOR nao consegue aprovar/rejeitar nota no beta.
4. FINANCEIRO nao consegue criar/editar campanhas.
5. ADMIN continua com acesso total.

## Definition of Done
1. Backend alinhado a matriz.
2. Testes negativos planejados/atualizados na task seguinte.
3. Nenhum modulo foi desligado globalmente.

## Validacao
- comandos/checks: typecheck API, testes de services/rotas afetadas.
- revisao manual: chamadas diretas contra endpoints criticos.

## Evidencia esperada
- Lista de rotas alteradas.
- Evidencia de 403/404 por role indevida.

## Riscos
- Quebrar fluxo legitimo de Admin/Gestor.
- Retornar 403 onde 404 seria melhor para ocultar existencia de recurso.

## Blockers possiveis
- Auditoria de gaps incompleta.

## Retorno esperado
- resumo curto do hardening
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
