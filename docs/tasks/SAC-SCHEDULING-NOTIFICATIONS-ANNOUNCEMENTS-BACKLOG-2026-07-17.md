# Backlog de Escalas, Notificacoes e Avisos SAC - 2026-07-17

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/SAC-SCHEDULING-NOTIFICATIONS-ANNOUNCEMENTS-BACKLOG-2026-07-17.md

## Objetivo
Estender a transformacao operacional SAC com escalas efetivas, cobertura integrada a pausas, notificacoes resolviveis, overlays consistentes e Avisos recorrentes governados.

## Baseline reconciliada
- `TASK-AT-363` criou a fronteira de times e membership historico SAC.
- `TASK-AT-367` a `TASK-AT-372` definem pausas, capacidade, swaps, overrides e overlap, mas a baseline usa janelas de turno da politica e nao uma escala efetiva diaria completa.
- `TASK-AT-044`, `TASK-AT-080` e `TASK-AT-085` entregaram notificacoes in-app, entidade/href e deep links; o fallback para entidade removida continua residual.
- O Perfil atual concentra identidade e historico/filtros de notificacao; qualquer preferencia sem efeito real deve ser removida, nao simulada.
- Popover de notificacoes, busca global, seletor de produtos, menu de emoji e menus de navegacao possuem comportamentos locais diferentes.
- Avisos possuem `startsAt`/`expiresAt`, vigencia e ciencia, mas nao regra recorrente, ocorrencia materializada ou edicao futura versionada.

## Invariantes
1. A escala efetiva diaria e a unica fonte de verdade para cobertura e elegibilidade de pausa.
2. Turno-base, regra, excecao e dobra nunca reescrevem historico publicado; mudancas futuras geram versao/ocorrencia nova.
3. Pausa fora do turno efetivo e rejeitada no backend; conflito posterior exige remarcacao explicita e auditada.
4. Troca/oferta de turno e atomica, tenant-scoped e subordinada a aprovacao configurada na versao da regra.
5. Notificacao armazena alvo tipado; `href` derivado nao substitui autorizacao nem existencia da entidade.
6. Entidade removida/arquivada abre fallback seguro e nao revela existencia cross-tenant.
7. Escape fecha apenas a camada superior e restaura foco; click-outside nao dispara acao interna involuntaria.
8. Regra recorrente e ocorrencia de Aviso sao separadas por chave idempotente e timezone IANA.
9. Evidencia fake/local nao aprova concorrencia, carga, scheduler ou rollout live.

## Sequencia recomendada
- Contrato, acesso e persistencia: TASK-AT-391 a TASK-AT-396.
- Notificacoes e superficies de escala: TASK-AT-397 a TASK-AT-403.
- Padrao compartilhado de overlays: TASK-AT-404 e TASK-AT-405.
- Avisos recorrentes: TASK-AT-406 a TASK-AT-408.
- Fechamento transversal: TASK-AT-409 a TASK-AT-416.

## Tasks
- `TASK-AT-391` - contrato canonico e delta arquitetural da frente.
- `TASK-AT-392` - RBAC, tenancy e auditoria de Escalas.
- `TASK-AT-393` - schema e migracoes aditivas de Escalas.
- `TASK-AT-394` - regras versionadas e configuracao gerencial.
- `TASK-AT-395` - materializacao da escala efetiva diaria.
- `TASK-AT-396` - excecoes, dobra e slot extra.
- `TASK-AT-397` - alvos tipados e resolucao de deep links.
- `TASK-AT-398` - centro de notificacoes, fallback e limpeza do Perfil.
- `TASK-AT-399` - calendario pessoal de escalas.
- `TASK-AT-400` - ofertas, trocas e aprovacoes de turno.
- `TASK-AT-401` - painel gerencial de escalas.
- `TASK-AT-402` - subordinacao e remarcacao explicita de Pausas.
- `TASK-AT-403` - cobertura operacional em tempo real.
- `TASK-AT-404` - primitive compartilhada de overlay dismissible.
- `TASK-AT-405` - migracao de popovers, dropdowns e pesquisas.
- `TASK-AT-406` - modelo recorrente e timezone de Avisos.
- `TASK-AT-407` - materializador idempotente de ocorrencias.
- `TASK-AT-408` - edicao futura, excecoes e governanca de recorrencia.
- `TASK-AT-409` - observabilidade, SLOs e alertas da frente.
- `TASK-AT-410` - testes unitarios, de dominio, integracao e concorrencia.
- `TASK-AT-411` - testes Web, E2E, acessibilidade e visual.
- `TASK-AT-412` - carga, coverage, contratos e gates.
- `TASK-AT-413` - seed deterministico de Escalas e Avisos recorrentes.
- `TASK-AT-414` - documentacao de produto, dados, API e operacao.
- `TASK-AT-415` - rollout e rollback ensaiados.
- `TASK-AT-416` - gate final de prontidao.

## Caminhos criticos
- Escalas e Pausas: TASK-AT-391 -> TASK-AT-392 -> TASK-AT-393 -> TASK-AT-394 -> TASK-AT-395 -> TASK-AT-396 -> TASK-AT-400 -> TASK-AT-402 -> TASK-AT-403.
- Notificacoes: TASK-AT-391 -> TASK-AT-397 -> TASK-AT-398; TASK-AT-397 tambem antecede TASK-AT-400 e TASK-AT-407.
- Avisos: TASK-AT-391 -> TASK-AT-392 -> TASK-AT-406 -> TASK-AT-407 -> TASK-AT-408.
- UI compartilhada: TASK-AT-404 -> TASK-AT-405; novas superficies devem consumir a primitive desde a origem.
- Fechamento: TASK-AT-409 -> TASK-AT-410 -> TASK-AT-411 -> TASK-AT-412 -> TASK-AT-413 -> TASK-AT-414 -> TASK-AT-415 -> TASK-AT-416.

## Decisoes a fechar antes de implementacao
1. Politica trabalhista/operacional de limite de horas, descanso e aprovacao para dobra/slot extra.
2. Tratamento de recorrencia no dia 29 em fevereiro nao bissexto: pular ou antecipar para o ultimo dia.
3. SLO e transporte de cobertura em tempo real: SSE/WebSocket ou polling com staleness maximo acordado.
4. Quando troca de turno exige aprovacao gerencial e quando aceite bilateral basta.
5. Retencao e exibicao de ocorrencias canceladas de Avisos recorrentes.
6. A branch atual nao possui preferencia persistida de notificacao no Perfil; confirmar qualquer controle inerte surgido na branch de execucao antes de remove-lo, preservando historico e filtros.
