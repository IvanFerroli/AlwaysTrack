# EXEC-AT-081 - Painel minimo de observabilidade operacional

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- task: TASK-AT-081

## Entrega
Foi criado um painel admin de saude operacional em Configuracoes, consumindo um novo endpoint de observabilidade sem adicionar coleta invasiva nem migration.

## Backend
- Novo endpoint admin `GET /v1/diagnostics/operations`.
- Agrega sinais existentes:
  - metricas HTTP em memoria;
  - DANFEs criadas/aprovadas/rejeitadas nas ultimas 24h;
  - falhas de extracao nas ultimas 24h;
  - FAQ abertas;
  - reviews Wiki pendentes;
  - notificacoes in-app nao lidas;
  - falhas recentes e eventos recentes de auditoria.

## Frontend
- Configuracoes ganhou secao `Saude operacional`.
- Admin consegue atualizar o snapshot, ver rotas mais lentas, falhas recentes e abrir Auditoria pelo shell.

## Testes
- Cobertura unitária do agregador em `http-metrics.test.ts`.

## Limites conhecidos
- As metricas HTTP sao em memoria e reiniciam com o processo.
- O painel nao substitui APM externo; ele serve como radar operacional minimo para demo e administracao local.
