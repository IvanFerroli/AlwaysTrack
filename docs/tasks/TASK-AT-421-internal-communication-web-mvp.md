# TASK-AT-421 - Workspace Web MVP de Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-421-internal-communication-web-mvp.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Web

## Origem documental
- `TASK-AT-417` e API da `TASK-AT-420`.

## Problema
Sem uma superfície própria, usuários não conseguem descobrir canais, conversar, retomar histórico ou perceber unread; inserir isso em Fluxos ou FAQ violaria as fronteiras definidas.

## Objetivo único
Entregar uma tela acessível de Comunicação com lista de conversas, histórico incremental, composer textual e leitura no modelo de polling limitado.

## Contexto mínimo
O shell atual concentra navegação role-aware e deve receber uma superfície própria, sem incorporar chat nas telas de Fluxos ou FAQ.

## Inputs
- API da `TASK-AT-420`.
- Capabilities da `TASK-AT-418`.
- Padrões de navegação, overlays, estados e acessibilidade existentes.

## Escopo
1. Nova rota/item de navegação `Comunicação` separado de Fluxos.
2. Lista de geral, directs, equipes e grupos com preview/unread.
3. Histórico com paginação anterior e atualização incremental limitada.
4. Composer textual com estado de envio, retry seguro e prevenção de duplicata.
5. Criação de direct/group somente quando a capability permitir.
6. Estados vazio, offline/degradado, loading e forbidden.

## Fora de escopo
- WebSocket/SSE, presença ou indicador de digitação.
- Anexos, reply, reação, edição, exclusão e rich embed.
- Administração completa de moderação.

## Arquivos ou domínios candidatos
- `apps/web/src/views/` — view futura de Comunicação.
- `apps/web/src/main.tsx`.
- `apps/web/src/notification-navigation.ts`.
- `apps/web/src/styles.css` ou CSS dedicado.
- `apps/web/test/` — testes futuros da view de Comunicação.

## Requisitos funcionais
1. Selecionar conversa carrega histórico e avança leitura após renderização confirmada.
2. Retry usa a mesma idempotency key.
3. Mensagens antigas carregam sem reposicionar o usuário inesperadamente.
4. Polling pausa quando a aba estiver oculta e permite atualização manual.
5. Deep link autorizado abre a conversa quando existir.

## Requisitos de permissão, tenant e auditoria
1. A Web usa capabilities retornadas/compartilhadas, mas o backend permanece autoridade.
2. IDs cross-tenant em URL não exibem preview, nome ou participante.
3. Conteúdo não é persistido em local storage, telemetria ou erros do cliente.
4. A UI diferencia remoção de membership de falha transitória sem revelar recursos ocultos.

## Checklist de execução
1. Integrar rota/navegação e tipos da API.
2. Implementar lista/histórico/composer.
3. Implementar paginação, retry e polling limitado.
4. Implementar criação autorizada e estados degradados.
5. Cobrir responsive, teclado e acessibilidade.

## Critérios de aceite
1. Usuário envia e recebe pelo polling uma mensagem em geral, direct, team e group autorizados.
2. Histórico, unread e marcação de leitura permanecem consistentes após sair e voltar.
3. Navegação e layout são utilizáveis em desktop e mobile.
4. Teclado, foco, labels e anúncios de erro/status atendem baseline de acessibilidade.

## Testes esperados
- Component tests de seleção, envio, retry, unread, paginação e estados vazios.
- E2E desktop/mobile de jornada geral e direct.
- Acessibilidade de lista, região de mensagens, composer e focus restore.
- Typecheck/build Web e `git diff --check`.

## Riscos
- Polling agressivo gerar carga ou reorder visual.
- Marcar lida cedo demais ocultar unread antes de exibição real.

## Dependências
- satisfeitas: primitive de overlays e navegação role-aware existentes.
- em aberto: `TASK-AT-420`; definição visual mínima aprovada.

## Blockers possíveis
- Contratos/capabilities da API instáveis.
- Polling/SLO do MVP não aceito pelo produto.

## Definição de pronto
1. Rota navegável e jornada textual completa integrada à API.
2. Suites Web/E2E básicas e acessibilidade verdes.
3. Limitações de polling e fase 2 visíveis na documentação.

## Evidência esperada
- Capturas desktop/mobile e resultados dos testes.
- Roteiro reproduzível de conversa geral e privada.

## Próximo passo provável
`TASK-AT-422`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar somente UI textual do MVP.
- constraints: sem WebSocket, presença ou interação social avançada.
