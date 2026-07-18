# TASK-AT-397 - Alvos tipados e deep links de Notificacoes

## Metadata
- status: implemented-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-397-typed-notification-targets-deep-links.md

## Modo
- mode: implementation

## Objetivo unico
Substituir navegacao baseada apenas em `href` por alvo tipado, resolucao autorizada e fallback seguro para entidade indisponivel.

## Contexto minimo
`InAppNotification` ja guarda `entityType`, `entityId` e `href`, mas a Web abre o href persistido diretamente. Entidade removida, arquivada, renomeada ou fora do escopo pode gerar tela vazia, link quebrado ou oracle de existencia.

## Dependencias
- satisfeitas: TASK-AT-044, TASK-AT-080, TASK-AT-085, TASK-AT-391 e TASK-AT-392.
- em aberto: exercitar telemetria e migrations em ambiente production-like; o contrato funcional esta implementado localmente.

## Estado reconciliado em 2026-07-18
- `InAppNotification` preserva o legado e adiciona `targetType`, `targetParamsJson` e `targetStatus`. Os 29 emissores ativos derivam alvos pelo catalogo Shared. `POST /v1/in-app-notifications/:notificationId/resolve` valida primeiro tenant e destinatario, recalcula role/escopo/existencia e retorna rota canonica ou `FORBIDDEN_OR_MISSING` sem IDs/href. O backfill cobre somente entidades conhecidas e trata FAQ promovida como Wiki.

## Alvos explicitos
1. Catalogo Shared de notification target type/params/fallback.
2. Schema/migracao aditiva e resolver API tenant-scoped.
3. Emissores de Escala, Pausa, Aviso, Wiki, FAQ e demais tipos ativos.

## Fora de escopo
- Canal externo ou push.
- Confiar em URL arbitraria fornecida pelo cliente.

## Checklist
1. Definir alvo por view/entidade/identificador e fallback de colecao.
2. Derivar deep link atual no resolver, preservando href legado durante migracao.
3. Validar destinatario, tenant, role, existencia e estado da entidade.
4. Retornar `AVAILABLE`, `ARCHIVED`, `REMOVED` ou `FORBIDDEN_OR_MISSING` sem vazar detalhes.
5. Backfill apenas tipos conhecidos; manter legado desconhecido nao acionavel.
6. Auditar fallback e medir hrefs legados/resolucoes falhas.

## Acceptance Criteria
1. Notificacao valida abre exatamente a entidade alvo e contexto/filtro correto.
2. Entidade removida/arquivada abre fallback seguro com mensagem acionavel.
3. Cross-tenant e sem permissao sao indistinguiveis para o destinatario.
4. Mudanca de rota Web nao exige rewrite em massa de notificacoes tipadas.

## Validacao
- comandos/checks: migration, resolver service/HTTP, anti-IDOR, contract tests e `git diff --check`.
- revisao manual: entidade ativa, arquivada, removida, slug alterado e outro tenant.

## Riscos
- Catalogo incompleto deixar notificacao aparentemente clicavel sem destino.

## Proximo passo provavel
TASK-AT-398

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: resolver backend e fallback canonico antes de novos emissores.
