# TASK-AT-398 - Centro de Notificacoes e limpeza do Perfil

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-398-notification-center-profile-cleanup.md

## Modo
- mode: implementation

## Objetivo unico
Consumir alvos resolvidos no sino/Perfil, apresentar fallback correto e remover preferencias de notificacao sem efeito real.

## Contexto minimo
O Perfil atual possui historico e filtros, nao um contrato real de preferencias de entrega. Controles ou campos que parecam configurar notificacoes sem alterar backend geram expectativa falsa.

## Dependencias
- satisfeitas: TASK-AT-397 e TASK-AT-059.
- em aberto: inventario final de preferencias mortas em branch de execucao.

## Alvos explicitos
1. NotificationCenter e historico de Notificacoes no Perfil.
2. Resolver/fallback, estado lido e mensagens de indisponibilidade.
3. Remocao de UI/schema/API morta, com migracao somente se existir persistencia real.

## Fora de escopo
- Criar preferencias novas por tipo/canal.
- Remover historico, filtros de leitura ou `readAt`.

## Checklist
1. Resolver alvo antes de navegar e marcar leitura conforme regra documentada.
2. Exibir entidade indisponivel sem href cru nem erro global.
3. Manter filtros de historico como filtros, nao chama-los de preferencias.
4. Inventariar toggles/campos sem consumidor backend e remove-los ponta a ponta.
5. Atualizar tipos, ajuda e testes sem deixar label/endpoint morto.

## Acceptance Criteria
1. Click em notificacao ativa abre alvo correto; fallback nao perde o contexto basico.
2. Item indisponivel continua consultavel no historico e nao entra em loop.
3. Perfil nao exibe controle de preferencia que nao altere entrega real.
4. Nenhum dado funcional de notificacao e apagado como efeito colateral da limpeza.

## Validacao
- comandos/checks: testes Web/API de navegacao/fallback, `rg` de preferencias mortas, typecheck/build e `git diff --check`.
- revisao manual: sino e Perfil com alvos ativos/removidos em desktop/mobile.

## Riscos
- Confundir filtro local de historico com preferencia persistida e remove-lo indevidamente.

## Proximo passo provavel
TASK-AT-399

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: remover somente controles comprovadamente sem efeito.

