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

## Contrato operacional
- `SupportShiftOccurrence` publicada e a fonte de verdade do turno efetivo.
- Membership define acesso a equipe, nao disponibilidade em um horario.
- Uma pausa precisa caber integralmente no turno publicado do operador.
- Enquanto uma equipe/data ainda nao possui ocorrencias publicadas, Pausas usa membership como fallback de transicao e identifica a fonte no payload.
- Mudanca de escala nunca move pausa silenciosamente. A reserva fica auditavel e exige escolha explicita de outro slot.
- Regras, padroes e recorrencias sao versionados. Edicoes afetam somente o futuro.
- Fevereiro sem dia 29 usa `SKIP`: nao antecipa nem desloca o aviso.

## Subida local reproduzivel
1. Na raiz, rodar `npm run up`.
2. O setup alinha schema, aplica seed, cria turnos ficticios e materializa Avisos recorrentes.
3. Entrar como `sac@example.com` para o calendario pessoal e como `admin@example.com` para o controle de gestao.
4. Em `SAC > Escalas`, confirmar a semana, o indicador de atualizacao e os turnos publicados.
5. Em `SAC > Pausas`, confirmar `Cobertura calculada por escala publicada` nos dias materializados.
6. Em `SAC > Avisos`, o gestor encontra a serie `Lembrete de NF`, dias 14 e 29.

## Operacao do SAC
1. Abrir `Escalas` e conferir o calendario pessoal.
2. Para um slot extra aberto, selecionar a candidatura. Se a regra exigir gestao, o status permanece pendente.
3. Para oferecer um turno ou propor troca, selecionar uma ocorrencia futura e, quando aplicavel, o colega/turno de destino.
4. A contraparte aceita ou recusa. A regra vigente determina aplicacao automatica ou aprovacao da gestao.
5. Abrir a notificacao para retornar ao mesmo dia, equipe e negociacao.
6. Se uma troca invalidar a pausa, abrir `Pausas`, escolher novo slot e confirmar `Reagendar pausa`.

## Operacao da gestao
1. Selecionar equipe explicitamente; o sistema nao escolhe a primeira equipe em nome da gestao.
2. Criar uma nova versao de regra com timezone, limites diarios/semanais, descanso, aviso previo e politica de aprovacao.
3. Criar padrao recorrente, atribuir ao operador e materializar o intervalo futuro.
4. Publicar slots extras conforme demanda e decidir candidaturas pendentes.
5. Decidir trocas pendentes depois de revisar cobertura, sobreposicao, descanso e limite mensal.
6. Conferir em `Pausas` os intervalos criticos e as reservas marcadas para reagendamento.

## Avisos recorrentes
1. Em `Avisos > Avisos recorrentes`, criar uma serie mensal.
2. Defaults locais: dias 14 e 29, `America/Sao_Paulo`, 09:00 e politica `SKIP`.
3. Cada ocorrencia materializada aponta para um Aviso proprio; ciencia e destinatarios nao sao compartilhados entre meses.
4. Para mudar texto, horario, publico ou vigencia, criar uma versao futura.
5. Para pular uma data, cancelar somente a ocorrencia com motivo.
6. Para encerrar a rotina, arquivar a serie. Nao excluir series, versoes ou ocorrencias.

## Scheduler e observabilidade
- Execucao manual: `npm run job:announcement-scheduler`.
- Frequencia de referencia: cinco minutos, conforme `deploy/cron.example`.
- Sucesso: evento `announcement.scheduler.completed` com `failed: 0` e `maxLagMs` abaixo de 600000.
- Falha: `announcement.scheduler.failed`, `failedOccurrenceIds` ou ocorrencia `SCHEDULED` com horario passado.
- Em `Administracao > Configuracoes > Saude operacional`, observar turnos publicados, trocas/extras pendentes, pausas para reagendar, series ativas, falhas e atrasos.

## Invariantes de seguranca
- SAC recebe somente Avisos `PUBLISHED`; filtros de query nao ampliam a visibilidade para rascunhos, agendados ou arquivados.
- Links de Avisos aceitam somente caminhos internos absolutos iniciados por `/` ou URLs `https://`. `http://`, `//`, `javascript:`, `data:` e caracteres de controle sao rejeitados.
- Publicacao e expiracao recorrentes usam claim e compare-and-set. Cancelamento, arquivamento ou nova versao vencem uma execucao concorrente e nao podem ser ressuscitados pelo job.
- Repetir candidatura ja pendente/aprovada e idempotente e nao reabre notificacoes lidas da gestao.
- Toda leitura/escrita de Escalas inclui `organizationId`; gestao informa equipe explicitamente e SAC permanece no proprio escopo.

## Diagnostico rapido
| Sintoma | Verificar | Curso de acao |
| --- | --- | --- |
| SAC nao ve escala | membership vigente, ocorrencias publicadas e intervalo da tela | corrigir atribuicao/materializar; nao criar booking manual |
| Pausa retorna conflito | turno cobrindo todo o slot, capacidade e cobertura minima | escolher outro slot ou revisar escala; override so com motivo e impacto confirmado |
| Pausa pede reagendamento | troca/extra cancelou a ocorrencia vinculada | escolher novo slot; a reserva anterior permanece no historico |
| Troca nao aplica | aceite da contraparte, aprovacao gerencial e limites da regra | abrir a negociacao pelo deep link e decidir; nao alterar status no banco |
| Aviso futuro nao aparece | serie ativa, versao vigente, timezone e scheduler | executar job manual, inspecionar log e ocorrencias atrasadas |
| Dia 29 nao aparece em fevereiro | politica `SKIP` | comportamento esperado; nao criar ocorrencia compensatoria |

## Rollback seguro
1. Desabilitar o cron `announcement-scheduler` para interromper novas publicacoes recorrentes.
2. Arquivar series afetadas para impedir materializacao futura sem apagar historico.
3. Manter leitura do calendario ativa durante rollback; interromper mutacoes antes de voltar uma imagem antiga.
4. Antes de desligar Escalas como fonte de Pausas, listar reservas com `shiftOccurrenceId` e `rescheduleRequiredAt` e reconciliar cada conflito.
5. O fallback por membership existe somente para equipes/datas sem escala publicada. Nao cancelar ocorrencias para forcar fallback.
6. Restaurar a imagem anterior e executar smoke por papel. Nao reverter migrations destrutivamente.

## Validacao minima
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm test --workspace @alwaystrack/api -- --run src/core/support-scheduling/support-scheduling.service.test.ts src/core/support-scheduling/support-scheduling.handlers.http.test.ts src/core/support-operations/support-operations.service.test.ts src/core/announcements/announcement-series.service.test.ts src/core/announcements/announcement-series.handlers.http.test.ts`
- `npm test --workspace @alwaystrack/web -- --run test/support-schedules.test.tsx test/support-pauses.test.tsx test/announcements.test.tsx test/notification-center.test.tsx`
- `npm run coverage --workspace @alwaystrack/api`
- `npm run coverage --workspace @alwaystrack/web`
- `SEED_ADMIN_PASSWORD='<senha-local>' npm run perf:support:read`
- Escrita idempotente somente em banco descartavel: `NODE_ENV=test PERF_ALLOW_TEST_WRITES=true SEED_ADMIN_PASSWORD='<senha-local>' npm run perf:support:idempotency`.
- `npx playwright test tests/e2e/support-scheduling.desktop.spec.ts --project=desktop`; se o browser do host nao iniciar, registrar a biblioteca de sistema ausente e nao converter o teste listado em evidencia executada.
- `npm run job:announcement-scheduler` duas vezes; a segunda deve criar zero duplicatas.

## Gates ainda externos
- Replay integral das migrations historicas, hoje bloqueado por migration antiga ja documentada.
- Concorrencia e isolation em PostgreSQL production-like.
- Rehearsal de backup/restore e rollback no ambiente alvo.
- Leitor de tela, Edge e operacao sustentada com equipe real autorizada.
