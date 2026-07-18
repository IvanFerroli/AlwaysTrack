# TASK-AT-398 - Centro de Notificacoes e limpeza do Perfil

## Metadata
- status: implementation-in-progress
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-398-notification-center-profile-cleanup.md

## Modo
- mode: implementation

## Objetivo unico
Concentrar notificacoes no sino, consumir alvos resolvidos com fallback correto e remover do Perfil a superficie redundante de notificacoes.

## Contexto minimo
O Perfil deve cuidar de identidade. Historico, filtros e acoes de notificacao duplicam o sino e confundem o lugar operacional correto, mesmo quando nao alteram a entrega.

## Dependencias
- satisfeitas: TASK-AT-397 e TASK-AT-059.
- em aberto: remover a superficie redundante do Perfil e validar que o sino permanece como centro unico.

## Estado reconciliado em 2026-07-18
- O sino resolve o alvo no backend antes de marcar leitura ou navegar, rejeita destinos arbitrarios e mantem nao lido quando a resolucao falha. Por decisao de produto, o Perfil nao deve mais listar, filtrar nem abrir notificacoes.

## Alvos explicitos
1. NotificationCenter global no sino.
2. Resolver/fallback, estado lido e mensagens de indisponibilidade.
3. Remocao de UI/schema/API morta, com migracao somente se existir persistencia real.

## Fora de escopo
- Criar preferencias novas por tipo/canal.
- Remover dados historicos, endpoint, `readAt` ou o centro global no sino.

## Checklist
1. Resolver alvo antes de navegar e marcar leitura conforme regra documentada.
2. Exibir entidade indisponivel sem href cru nem erro global.
3. Remover do Perfil historico, filtros, fetch e handlers de notificacao.
4. Inventariar toggles/campos sem consumidor backend e remove-los ponta a ponta.
5. Atualizar tipos, ajuda e testes sem deixar label/endpoint morto no Perfil.

## Acceptance Criteria
1. Click em notificacao ativa abre alvo correto; fallback nao perde o contexto basico.
2. Item indisponivel continua tratado no sino sem entrar em loop.
3. Perfil nao consulta nem exibe notificacoes; identidade e edicao do usuario continuam funcionais.
4. Nenhum dado funcional de notificacao e apagado como efeito colateral da limpeza.

## Validacao
- comandos/checks: testes Web/API de navegacao/fallback, `rg` de preferencias mortas, typecheck/build e `git diff --check`.
- revisao manual: sino com alvos ativos/removidos e Perfil sem notificacoes em desktop/mobile.

## Riscos
- Remover por engano o centro global, os dados historicos ou o contrato `readAt` ao limpar somente o Perfil.

## Proximo passo provavel
TASK-AT-399

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: remover somente controles comprovadamente sem efeito.
