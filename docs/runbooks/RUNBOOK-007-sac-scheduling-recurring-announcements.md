# RUNBOOK-007 - Escalas SAC, pausas e avisos recorrentes

## Metadata
- status: active
- owner: support-operations-maintainers
- secondary-owner: platform-maintainers
- last-updated: 2026-07-18
- source-of-truth: docs/runbooks/RUNBOOK-007-sac-scheduling-recurring-announcements.md

## Objetivo
Operar Escalas SAC, extras, trocas, pausas subordinadas e Avisos recorrentes sem depender de contexto oral nem editar o banco manualmente.

## Limite do procedimento
- Validado com dados ficticios em ambiente local.
- Nao aprova rollout externo ou uso de SQLite sob concorrencia real.
- Escala nao e folha de ponto, controle de presenca ou calculo de pagamento.
- Trocas e extras registram a decisao operacional; pagamento continua fora do produto.
- O `GO` documentado cobre somente demo local do subconjunto implementado; nao cobre excecoes completas, carga ou rollback production-like.

## Contrato operacional
- `SupportShiftOccurrence` publicada e a fonte de verdade do turno efetivo.
- Membership define acesso a equipe, nao disponibilidade em um horario.
- Uma pausa precisa caber integralmente no turno publicado do operador.
- Enquanto uma equipe/data ainda nao possui ocorrencias publicadas, Pausas usa membership como fallback de transicao e identifica a fonte no payload.
- Mudanca de escala nunca move pausa silenciosamente. A reserva fica auditavel e exige escolha explicita de outro slot.
- Regras, padroes e recorrencias sao versionados. Edicoes afetam somente o futuro.
- Fevereiro sem dia 29 usa `SKIP`: nao antecipa nem desloca o aviso.
- Troca de Pausa e troca de turno sao workflows distintos. A primeira reserva locks exclusivos para os dois bookings; a segunda segue a regra versionada de autoaprovacao/aprovacao gerencial.
- KPIs usam definicao, unidade, direcao e agregacao proprias; CSAT 1-5 nao e percentual e SLA temporal nao e taxa. Campanhas SAC consomem KPI aprovado compativel, preservam publico/proveniencia e nao criam ranking nominal.
- Celula vazia, `-`, nao aplicavel e fonte invalida nunca viram zero. Cada registro preserva estado do dado, texto original aplicavel, timezone e ano de referencia; apenas `AVAILABLE` alimenta consolidado ou campanha.
- Notificacoes preservam `entityType`, `entityId` e `href` para legado, mas a acao usa target tipado resolvido no backend sob destinatario, tenant, role, escopo e estado atuais.

## Subida local reproduzivel
1. Na raiz, rodar `npm run up`.
2. O setup alinha schema, aplica seed, cria turnos ficticios e materializa Avisos recorrentes.
3. Entrar como `sac@example.com` para o calendario pessoal e como `admin@example.com` para o controle de gestao.
4. Em `SAC > Escalas`, confirmar a semana, o indicador de atualizacao e os turnos publicados.
5. No Dashboard SAC, confirmar a jornada de hoje; `folga` so pode aparecer quando a escala efetiva devolver o dia como `OFF`.
6. Em `SAC > Pausas`, confirmar `Cobertura calculada por escala publicada` nos dias materializados.
7. Em `SAC > Avisos`, o gestor encontra a serie `Lembrete de NF`, dias 14 e 29.

## Operacao do SAC
1. Abrir `Escalas` e conferir o calendario pessoal.
2. Para um slot extra aberto, selecionar a candidatura. Se a regra exigir gestao, o status permanece pendente.
3. Para oferecer um turno ou propor troca, selecionar uma ocorrencia futura e, quando aplicavel, o colega/turno de destino.
4. A contraparte aceita ou recusa. A regra vigente determina aplicacao automatica ou aprovacao da gestao.
5. Abrir a notificacao para retornar ao mesmo dia, equipe e negociacao.
6. Se uma troca invalidar a pausa, abrir `Pausas`, escolher novo slot e confirmar `Reagendar pausa`.

## Operacao da gestao
1. Selecionar equipe explicitamente; o sistema nao escolhe a primeira equipe em nome da gestao.
2. Criar e salvar um rascunho de regra com timezone, limites diarios/semanais, descanso, aviso previo e politica de aprovacao.
3. Gerar a previa, revisar diff e conflitos da janela e somente entao publicar; preview stale deve ser refeito.
4. Criar padrao recorrente, atribuir ao operador e materializar o intervalo futuro.
5. Publicar slots extras conforme demanda e decidir candidaturas pendentes.
6. Decidir trocas pendentes depois de revisar cobertura, sobreposicao, descanso e limite mensal.
7. Conferir em `Pausas` os intervalos criticos e as reservas marcadas para reagendamento.

## KPIs e Campanhas SAC
1. Em `Performance`, publicar somente entradas revisadas; correcao de KPI aprovado cria nova revisao e preserva a anterior.
2. Conferir a unidade antes de comparar: CSAT e nota 1-5; SLA e duracao; satisfacao/resolucao de canal sao percentuais; primeira resposta e duracao.
3. Nao combinar fechamento mensal com os intervalos reportados do mesmo mes nem expectativa com realizado.
4. Em `Campanhas`, publicar a partir de metrica SAC e escopo explicito. Depois de ativa, nao alterar destrutivamente regra, publico ou proveniencia.
5. Ao fechar a Campanha, conferir que o resultado usa KPIs aprovados do mesmo periodo/escopo, unidade, canal e granularidade.
6. Se a fonte nao trouxer valor, escolher o estado correspondente; nao digitar `0` para preencher a lacuna.
7. Informar ano de referencia e preservar o intervalo tal como reportado; nao renomear intervalo irregular como semana ISO.

## Avisos recorrentes
1. Em `Avisos > Avisos recorrentes`, criar uma serie mensal.
2. Defaults locais: dias 14 e 29, `America/Sao_Paulo`, 09:00 e politica `SKIP`.
3. Cada ocorrencia materializada aponta para um Aviso proprio; ciencia e destinatarios nao sao compartilhados entre meses.
4. Para mudar texto, horario, publico ou vigencia, criar uma versao futura.
5. Para pular uma data, cancelar somente a ocorrencia com motivo.
6. Para encerrar a rotina, arquivar a serie. Nao excluir series, versoes ou ocorrencias.

## Scheduler e observabilidade
- Horizonte de Escalas manual: `npm run job:support-schedule-horizon`.
- Horizonte configuravel: `SUPPORT_SCHEDULE_HORIZON_DAYS`, inteiro de 1 a 61, default 30.
- Frequencia de referencia do horizonte: diaria, conforme `deploy/cron.example`; qualquer equipe com falha torna a execucao nao-zero sem interromper as demais.
- Sucesso do horizonte: evento `support_schedule.horizon.completed` com `failed: 0`; os metadados agregam contagens e codigos sem tenant/team/user IDs.
- Execucao manual: `npm run job:announcement-scheduler`.
- Frequencia de referencia: cinco minutos, conforme `deploy/cron.example`.
- Sucesso: evento `announcement.scheduler.completed` com `failed: 0` e `maxLagMs` abaixo de 600000.
- Falha: `announcement.scheduler.failed`, `failedOccurrenceIds` ou ocorrencia `SCHEDULED` com horario passado.
- Em `Administracao > Configuracoes > Saude operacional`, observar turnos publicados, trocas/extras pendentes, pausas para reagendar, series ativas, falhas e atrasos.

## Entrega de notificacoes externas
- `npm run job:notifications` percorre a organizacao de cada ADMIN ativo, sem limitar o job ao primeiro tenant encontrado.
- Cada job e reclamado por compare-and-set. `PROCESSING` sem progresso por 15 minutos pode ser retomado e `maxAttempts` e respeitado por registro.
- Somente `WHATSAPP` com template do mesmo canal e telefone pode chegar ao provider atual; `EMAIL`/`DASHBOARD`, template divergente ou destinatario ausente falham terminalmente sem envio indevido.
- Webhooks Meta localizam o job pela chave unica `(provider, providerMessageId)` e ignoram evento repetido ou regressao de `READ`/`DELIVERED` para estado anterior.
- Ainda existe uma janela externa entre o aceite do provider e a persistencia de `SENT`. Sem chave de idempotencia honrada pelo provider, crash nessa janela pode produzir reenvio apos o lease.

## Invariantes de seguranca
- SAC recebe somente Avisos `PUBLISHED`; filtros de query nao ampliam a visibilidade para rascunhos, agendados ou arquivados.
- Links de Avisos aceitam somente caminhos internos absolutos iniciados por `/` ou URLs `https://`. `http://`, `//`, `javascript:`, `data:` e caracteres de controle sao rejeitados.
- Publicacao e expiracao recorrentes usam claim e compare-and-set. Cancelamento, arquivamento ou nova versao vencem uma execucao concorrente e nao podem ser ressuscitados pelo job.
- Repetir candidatura ja pendente/aprovada e idempotente e nao reabre notificacoes lidas da gestao.
- Toda leitura/escrita de Escalas inclui `organizationId`; gestao informa equipe explicitamente e SAC permanece no proprio escopo.
- Cada booking participa de no maximo um swap de Pausa pendente. Aceite usa compare-and-set, revalida os dois slots e turnos e libera os locks no mesmo resultado transacional.
- Nao tratar o parser Web nem o href legado como autorizacao. Toda acao do sino deve resolver o target no backend antes de marcar leitura ou navegar; o Perfil nao lista notificacoes.

## Diagnostico rapido
| Sintoma | Verificar | Curso de acao |
| --- | --- | --- |
| SAC nao ve escala | membership vigente, ocorrencias publicadas e intervalo da tela | corrigir atribuicao/materializar; nao criar booking manual |
| Pausa retorna conflito | turno cobrindo todo o slot, capacidade e cobertura minima | escolher outro slot ou revisar escala; override so com motivo e impacto confirmado |
| Pausa pede reagendamento | troca/extra cancelou a ocorrencia vinculada | escolher novo slot; a reserva anterior permanece no historico |
| Troca nao aplica | aceite da contraparte, aprovacao gerencial e limites da regra | abrir a negociacao pelo deep link e decidir; nao alterar status no banco |
| Troca de Pausa retorna conflito | locks dos dois bookings, status/slot atuais e turnos publicados dos dois operadores | atualizar a agenda e criar nova proposta; nao reutilizar swap stale |
| Horizonte termina nao-zero | `failureCodes` do evento, ADMIN ativo e regra intersectando a janela por equipe | corrigir a equipe indicada pelos sinais internos e reexecutar o job; nao ampliar logs com IDs/PII |
| KPI aparece como zero sem fonte | estado do dado, valor original e versao da definicao | corrigir por nova revisao como `NOT_REPORTED`, `NOT_APPLICABLE` ou `INVALID_SOURCE`; nao apagar o registro aprovado |
| Campanha diverge do indicador | realizado versus expectativa, canal, granularidade, periodo, escopo e audiencia congelada | alinhar a identidade da serie; nao misturar fechamento mensal com intervalos nem recomputar publico historico |
| Aviso futuro nao aparece | serie ativa, versao vigente, timezone e scheduler | executar job manual, inspecionar log e ocorrencias atrasadas |
| Dia 29 nao aparece em fevereiro | politica `SKIP` | comportamento esperado; nao criar ocorrencia compensatoria |

## Rollback seguro
1. Desabilitar o cron `announcement-scheduler` para interromper novas publicacoes recorrentes.
2. Arquivar series afetadas para impedir materializacao futura sem apagar historico.
3. Manter leitura do calendario ativa durante rollback; interromper mutacoes antes de voltar uma imagem antiga.
4. Antes de desligar Escalas como fonte de Pausas, listar reservas com `shiftOccurrenceId` e `rescheduleRequiredAt` e reconciliar cada conflito.
5. O fallback por membership existe somente para equipes/datas sem escala publicada. Nao cancelar ocorrencias para forcar fallback.
6. Restaurar a imagem anterior e executar smoke por papel. Nao reverter migrations destrutivamente.
7. Nao assumir feature flags: elas nao estao implementadas por frente. O disable atual depende de interromper mutacoes/cron e da coordenacao da imagem de aplicacao.

## Validacao minima
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm test --workspace @alwaystrack/api -- --run src/core/support-scheduling/support-scheduling.service.test.ts src/core/support-scheduling/support-scheduling.handlers.http.test.ts src/core/support-operations/support-operations.service.test.ts src/core/announcements/announcement-series.service.test.ts src/core/announcements/announcement-series.handlers.http.test.ts`
- `npm test --workspace @alwaystrack/web -- --run test/support-schedules.test.tsx test/support-pauses.test.tsx test/support-performance.test.tsx test/support-campaigns.test.tsx test/announcements.test.tsx test/notification-center.test.tsx test/notification-navigation.test.ts`
- `npm run coverage --workspace @alwaystrack/api`
- `npm run coverage --workspace @alwaystrack/web`
- `npm run perf:support:validate`
- `SEED_ADMIN_PASSWORD='<senha-local>' npm run perf:support:read`
- Escrita idempotente somente em banco descartavel: `NODE_ENV=test PERF_ALLOW_TEST_WRITES=true SEED_ADMIN_PASSWORD='<senha-local>' npm run perf:support:idempotency`.
- Bursts de candidatura/recorrencia somente em banco descartavel: `NODE_ENV=test PERF_ALLOW_TEST_WRITES=true SEED_ADMIN_PASSWORD='<senha-local>' npm run perf:support:claim-burst` e `npm run perf:support:recurrence`.
- `npx playwright test --list`, `npx playwright test --project=api` e os specs `support-operations.desktop.spec.ts`/`support-operations.mobile.spec.ts`; se o browser do host nao iniciar, registrar a biblioteca de sistema ausente e nao converter teste listado em evidencia executada.
- `npm run job:announcement-scheduler` duas vezes; a segunda deve criar zero duplicatas.
- `npm run job:support-schedule-horizon` duas vezes; a segunda deve reutilizar snapshots sem duplicar ocorrencias.

## Gates ainda externos
- Replay integral das migrations historicas, hoje bloqueado por migration antiga ja documentada.
- Concorrencia e isolation em PostgreSQL production-like.
- Rehearsal de backup/restore e rollback no ambiente alvo.
- Leitor de tela, Edge e operacao sustentada com equipe real autorizada.
- Carga real, stress/spike/soak, alertas exercitados e scheduler sustentado.

## Lacunas internas conhecidas
- Excecoes completas de ausencia/ajuste alem da folga derivada do padrao.
- Flags independentes por frente.
- Propagacao completa de intents de Escalas/Pausas ate highlight/foco na UI.
- Seed integral e matriz E2E de SUPERVISOR/trocas/remarcacao/axe/visual.
