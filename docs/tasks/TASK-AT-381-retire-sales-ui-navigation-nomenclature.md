# TASK-AT-381 - Retirada visual e nominal de Vendas

## Metadata
- status: proposed
- pipeline: BLOCKED_BY_DECISION
- classified-by: olympus-taskyfier run #2 (2026-09-03) — audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, seção K.1: a cadeia 362/365/381 assume sunset de Vendas e só pode ser ratificada/ajustada pela decisão humana de `TASK-AT-454` (finding `ATUX-001`); não executar antes
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-381-retire-sales-ui-navigation-nomenclature.md

## Modo
- mode: migration

## Objetivo unico
Remover Notas, Ranking, Extratos e toda nomenclatura operacional de Vendas da experiencia ativa, promovendo Pausas, Performance e Campanhas SAC.

## Contexto minimo
Mesmo com backend congelado, menus, deep links, notificacoes, ajuda, busca e seeds podem manter a operacao comercial aparente ou acessivel.

## Dependencias
- satisfeitas: TASK-AT-366, TASK-AT-372, TASK-AT-377 e TASK-AT-380.
- em aberto: TASK-AT-389 governa sunset final da ponte API.

## Alvos explicitos
1. Navegacao, ViewKey, rotas/deep links e dashboard Web.
2. Busca, notificacoes, ajuda, textos, empty states e Usuarios/Times.
3. Testes/fixtures que ainda apresentam Vendas como produto ativo.

## Fora de escopo
- Apagar componentes legados antes do fim do rollback.
- Renomear dados historicos para SAC.

## Checklist
1. Retirar views Notas, Ranking e Extratos da navegacao e roteamento operacional.
2. Substituir Campanhas comerciais pela nova view Campanhas SAC.
3. Remover labels Vendas/Vendedor/nota/ranking/extrato de superficies ativas.
4. Tratar deep links antigos com destino de sunset, sem tela fantasma.
5. Manter arquivo legado apenas no canal ADMIN explicitamente rotulado.
6. Parar oferta de roles legadas em novos cadastros e governar contas existentes conforme TASK-AT-362.

## Acceptance Criteria
1. SAC, SUPERVISOR, GESTOR e ADMIN nao encontram superficie operacional de Vendas.
2. URL antiga nao reabre view removida nem executa request de escrita.
3. Ajuda, busca, notificacao, breadcrumbs e textos refletem apenas SAC ativo.
4. Dado legado continua consultavel pelo caminho administrativo autorizado.

## Validacao
- comandos/checks: `rg` de nomenclatura com allowlist de legado, testes de navegacao/roles, build Web e `git diff --check`.
- revisao manual: percorrer desktop/mobile e abrir todos os deep links antigos.

## Riscos
- Texto ou CTA residual continuar chamando rota congelada.

## Proximo passo provavel
TASK-AT-382

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: manter allowlist documentada para referencias historicas/tecnicas inevitaveis.
