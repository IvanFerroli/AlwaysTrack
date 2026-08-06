# TASK-AT-425 - Tempo real e presença da Comunicação Interna

## Metadata
- status: proposed-phase-2
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-425-internal-communication-realtime-presence.md

## Modo
- mode: implementation
- priority: P2
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Realtime

## Origem documental
- Evolução condicionada ao gate `TASK-AT-424` e à decisão de infraestrutura/presença.

## Problema
Polling atende o MVP, mas pode gerar latência e carga em escala. Presença online acrescenta expectativa de privacidade e semântica que ainda não foram decididas.

## Objetivo único
Adicionar entrega incremental em tempo real e, se aprovada, presença efêmera sem alterar a persistência canônica de mensagens/unread.

## Contexto mínimo
O WebSocket atual é loopback do Companion e não atende chat multiusuário; o transporte futuro exige decisão/infra próprias.

## Inputs
- MVP aprovado na `TASK-AT-424`.
- Métricas de volume/latência do polling.
- Política humana de presença e infraestrutura disponível.

## Escopo
1. Spike comparativo SSE/WebSocket/provider e decisão registrada.
2. Eventos de nova mensagem, read cursor e alteração de membership.
3. Reconexão com cursor e fallback para polling.
4. Presença efêmera com TTL somente se a política humana for aprovada.
5. Backpressure, limites, observabilidade e degradação segura.

## Fora de escopo
- Indicador de digitação, chamadas de voz/vídeo e push móvel.
- Tornar broker a fonte de verdade.
- Persistir histórico detalhado de presença.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — transporte futuro da Comunicação.
- `apps/web/src/views/` — integração futura na view de Comunicação.
- `docs/adr/` — ADR futuro de transporte realtime.
- Infra Redis/queue somente se aprovada pelo ADR.

## Requisitos funcionais
1. Evento perdido é recuperado pelo cursor HTTP.
2. Duplicata ou reorder não duplica mensagem na UI.
3. Fallback de polling mantém a jornada funcional.
4. Presença expira automaticamente e não equivale a disponibilidade laboral.

## Requisitos de permissão, tenant e auditoria
1. Autorização ocorre no subscribe e é revalidada após mudança de membership.
2. Canal/evento é tenant-scoped e não carrega participantes desnecessários.
3. Presença respeita opt-out/política aprovada e não vira métrica individual.
4. Logs não registram corpo de mensagem nem linha do tempo pessoal de presença.

## Checklist de execução
1. Executar spike/ADR do transporte.
2. Definir protocolo de evento/cursor/replay.
3. Implementar subscribe/reconnect/fallback.
4. Implementar presença somente se aprovada.
5. Validar carga, backpressure e segurança.

## Critérios de aceite
1. Realtime reduz latência sem mudar contratos de persistência/unread.
2. Reconexão, evento duplicado e mudança de permissão fecham com segurança.
3. Presença só é ativada com semântica e retenção aprovadas.
4. Queda do canal degrada para polling de forma visível.

## Testes esperados
- Reconexão, replay, reorder, duplicata, backpressure e múltiplas abas.
- Cross-tenant subscribe e remoção de membership durante sessão.
- Carga/soak production-like do canal escolhido.
- E2E com fallback e `git diff --check`.

## Riscos
- Infra realtime ampliar superfície operacional e custo.
- Presença virar vigilância ou indicador falso de disponibilidade.

## Dependências
- satisfeitas: MVP persistente e polling como fallback.
- em aberto: `TASK-AT-424` com GO; decisão humana de infraestrutura e presença.

## Blockers possíveis
- Nenhuma opção atende SLO/custo operacional.
- Política de presença não aprovada.

## Definição de pronto
1. ADR aprovado, protocolo versionado e fallback comprovado.
2. Testes de carga/reconexão e segurança possuem evidência production-like.
3. Presença permanece desligada se decisão de privacidade não existir.

## Evidência esperada
- Benchmark das opções e manifesto de carga/recovery.
- Política de presença e opt-out, quando aplicável.

## Próximo passo provável
`TASK-AT-426`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: iniciar pelo ADR/spike e preservar HTTP como fonte recuperável.
- constraints: sem presença por default e sem broker como storage canônico.
