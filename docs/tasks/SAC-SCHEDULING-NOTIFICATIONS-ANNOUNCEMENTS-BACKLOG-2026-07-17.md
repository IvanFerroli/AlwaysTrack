# Backlog de Escalas, Notificacoes e Avisos SAC - 2026-07-17

## Metadata
- status: implemented-partial-local-rollout-no-go
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/SAC-SCHEDULING-NOTIFICATIONS-ANNOUNCEMENTS-BACKLOG-2026-07-17.md

## Objetivo
Estender a transformacao operacional SAC com escalas efetivas, cobertura integrada a pausas, notificacoes resolviveis, overlays consistentes e Avisos recorrentes governados.

## Resultado da execucao local
- Completas no recorte local implementado: TASK-AT-391, TASK-AT-394/395, TASK-AT-397/398, TASK-AT-403 a TASK-AT-406.
- Parciais ou em execucao contra o contrato vigente: TASK-AT-392/393, TASK-AT-396, TASK-AT-399, TASK-AT-401/402, TASK-AT-408 e TASK-AT-413/414.
- TASK-AT-400, TASK-AT-407, TASK-AT-409 e TASK-AT-410 possuem implementacao/testes locais, mas concorrencia, scheduler e alertas production-like permanecem externos.
- TASK-AT-411 possui suites Web e specs desktop/mobile para SAC, GESTOR e ADMIN; SUPERVISOR, workflows completos, axe/visual e a execucao de Chromium neste host permanecem pendentes.
- TASK-AT-412 registra API 80,72% e Web 56,53% de linhas, mais cinco harnesses Artillery guardados para leitura, cobertura, idempotencia, claim burst e recorrencia; os planos concorrentes nao foram executados.
- TASK-AT-415/416: demo local do subconjunto existente `GO`; rollout interno/externo `NO-GO`.

## Baseline reconciliada
- `TASK-AT-363` criou a fronteira de times e membership historico SAC.
- `TASK-AT-367` a `TASK-AT-372` definem pausas, capacidade, swaps, overrides e overlap, mas a baseline usa janelas de turno da politica e nao uma escala efetiva diaria completa.
- `TASK-AT-373` a `TASK-AT-380` implementam KPIs ponderados e Campanhas SAC governadas. Esta frente deve preservar esses contratos e seus testes; nao os reimplementa nem os converte em ranking nominal.
- `TASK-AT-044`, `TASK-AT-080` e `TASK-AT-085` entregaram notificacoes in-app. `TASK-AT-397/398` adicionaram target tipado, resolver tenant-scoped e fallback autorizado antes da leitura/navegacao.
- O Perfil concentra somente identidade; notificacoes, historico e acoes ficam no sino para evitar duas superficies concorrentes.
- Popover de notificacoes, busca global, seletor de produtos, menu de emoji e menus de navegacao compartilham a mesma primitive de dismissal, com semantica de teclado especifica por controle.
- Avisos possuem `startsAt`/`expiresAt`, vigencia e ciencia, mas nao regra recorrente, ocorrencia materializada ou edicao futura versionada.

## Invariantes
1. Quando equipe/data possui ocorrencia publicada, ela e a fonte de verdade para cobertura e elegibilidade de Pausa. O fallback por membership existe apenas na transicao de equipe/data sem ocorrencia publicada, deve ser identificado no payload e bloqueia declarar cutover concluido.
2. Turno-base, regra, excecao e dobra nunca reescrevem historico publicado; mudancas futuras geram versao/ocorrencia nova.
3. Pausa fora do turno efetivo e rejeitada no backend; conflito posterior exige remarcacao explicita e auditada.
4. Troca/oferta de turno e tenant-scoped e subordinada a aprovacao da regra; atomicidade production-like continua gate externo.
5. Troca de Pausa e distinta de troca de turno: cada booking participa de no maximo um swap pendente por lock exclusivo, e aceite revalida ambos os slots/turnos na mesma transacao.
6. A notificacao preserva `entityType`, `entityId` e `href` para legado, mas a navegacao acionavel usa target tipado resolvido no backend sob tenant, destinatario, role, escopo e existencia atuais.
7. Entidade removida/arquivada so abre fallback canonico apos resolucao tenant-scoped; cross-tenant, sem permissao e ausente retornam falha fechada sem IDs/href.
8. Escape fecha apenas a camada superior e restaura foco; click-outside nao dispara acao interna involuntaria nas superficies ja migradas.
9. Regra recorrente e ocorrencia de Aviso sao separadas por chave idempotente e timezone IANA.
10. KPIs agregam numerador/denominador ou amostra ponderada; Campanhas usam apenas KPI aprovado e preservam snapshot de publico/proveniencia.
11. Evidencia fake/local nao aprova concorrencia, carga, scheduler ou rollout live.

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

## Decisoes fechadas na implementacao
1. Limites de jornada, descanso, antecedencia, trocas e aprovacao sao versionados por equipe; pagamento permanece fora do produto.
2. Fevereiro sem dia 29 usa `SKIP`.
3. Cobertura usa polling de 45 segundos com atualizacao manual e indicador visivel.
4. Troca pode ser autoaprovada pela regra; quando a regra exige gestao, aceite bilateral gera pendencia gerencial.
5. Ocorrencias canceladas/expiradas permanecem auditaveis e nao sao apagadas.
6. Sino mantem notificacoes clicaveis; Perfil nao consulta nem exibe historico ou preferencia de notificacao.
7. Materializacao de Escalas continua disponivel por API/painel e possui job/cron multi-tenant para manter o horizonte futuro configuravel.
8. Troca de Pausa usa `SupportPauseSwapBookingLock` exclusivo por booking; conflito legado de migration exige nova confirmacao.
9. O catalogo tipado esta no Shared; persistencia aditiva, resolver API e consumo Web antes da leitura estao implementados.
10. KPIs/Campanhas permanecem na baseline SAC e entram nesta frente somente como regressao operacional.

## Lacunas que bloqueiam fechamento integral
1. Excecoes completas de folga, ausencia, ajuste, revogacao e preview antes/depois.
2. Draft/diff/archive de regra.
3. Propagacao completa de intents de Escalas/Pausas ate o item destacado na UI e telemetria live de resolucao.
4. Matriz E2E de SUPERVISOR/trocas/remarcacao/axe/visual e seed com todos os cenarios planejados.
5. Flags independentes, carga/concorrencia PostgreSQL, alertas, backup/restore e rollback no ambiente alvo.
