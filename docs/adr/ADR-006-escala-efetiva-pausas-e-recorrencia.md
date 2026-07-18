# ADR-006 - Escala efetiva, pausas e recorrencia

## Metadata
- status: accepted
- owner: olympus_orchestrator
- last-updated: 2026-07-17
- source-of-truth: docs/adr/ADR-006-escala-efetiva-pausas-e-recorrencia.md

## Contexto
Pausas SAC foram entregues inicialmente a partir de memberships e janelas globais. A operacao agora precisa distinguir turno-base, ocorrencia diaria, dobra, troca e ausencia, mantendo cobertura, auditoria e notificacoes coerentes. Avisos tambem precisam de recorrencia mensal sem reusar ciencia ou alterar publicacoes passadas.

## Decisao
1. `SupportTeamMembership` define elegibilidade e fronteira de dados; nunca prova disponibilidade em um horario.
2. `SupportShiftPatternVersion` e `SupportShiftAssignment` descrevem a regra recorrente. `SupportShiftOccurrence` publicada e a unica fonte de verdade da escala efetiva de um operador em uma data.
3. Toda ocorrencia preserva a versao e o snapshot de `SupportScheduleRuleVersion` usados na publicacao. Versoes publicadas nao sao reescritas.
4. Instantes persistidos usam UTC. `localDate` e calculada no timezone IANA da regra e preserva a chave operacional usada para materializacao, busca e idempotencia.
5. Troca bilateral elegivel pode ser aprovada automaticamente quando a regra vigente permitir. Dobra, quebra de limite, conflito de cobertura ou excecao exige decisao gerencial com motivo.
6. Pausa exige uma ocorrencia publicada cobrindo integralmente o intervalo, respeitando o buffer de borda. Durante o rollout, bookings legados usam dual-read; bookings novos recebem `shiftOccurrenceId`.
7. Mudanca de escala nao move pausa silenciosamente. Booking incompatível recebe estado de remarcacao, preserva o anterior e exige escolha explicita, cancelamento ou override auditado.
8. Cobertura e calculada por intervalo como operadores com ocorrencia publicada menos operadores em pausa. Membership sem ocorrencia nao entra no total quando o modo de escala estiver ativo.
9. Atualizacao inicial do painel usa polling com staleness alvo de ate 60 segundos. Transporte push pode substituir o polling sem alterar o contrato de leitura.
10. Recorrencia de Avisos e limitada a ocorrencia unica ou mensal por dias do mes. Um dia inexistente, como 29 em fevereiro nao bissexto, e pulado e nunca antecipado silenciosamente.
11. Cada ocorrencia recorrente cria um `Announcement` independente, com audiencia, notificacao, janela e ciencia proprias. Edicoes afetam somente datas futuras ainda nao materializadas.
12. Destinos de notificacao sao tipados no dominio e convertidos em URL interna. A URL nao substitui autorizacao, tenancy ou verificacao de existencia.

## Alternativas consideradas
1. Calcular escala diretamente de memberships: rejeitada porque transforma cadastro de time em disponibilidade ficticia.
2. Manter somente janelas JSON em Pausas: rejeitada por duplicar a fonte de turno e impedir excecoes individuais.
3. Mover pausas automaticamente apos uma troca: rejeitada porque oculta uma decisao operacional do atendente.
4. Antecipar recorrencia inexistente para o ultimo dia do mes: rejeitada por surpreender a gestao em uma comunicacao obrigatoria.
5. Adotar WebSocket imediatamente: adiado; polling curto atende o primeiro rollout e reduz superficie operacional.

## Consequencias
- positivas: cobertura explicavel, calendario individual, historico imutavel, regras customizaveis e recorrencia idempotente.
- negativas: mais entidades temporais, materializacao obrigatoria e periodo de dual-read para bookings antigos.
- trade-offs: polling pode atrasar a visao em ate 60 segundos; o contrato permite evolucao posterior para SSE ou WebSocket.

## Impacto em artefatos
- specs relacionadas: docs/tasks/SAC-SCHEDULING-NOTIFICATIONS-ANNOUNCEMENTS-BACKLOG-2026-07-17.md
- tasks relacionadas: TASK-AT-391 a TASK-AT-416
- runbooks relacionados: docs/operations/migration-rollback-runbook.md

## Validacao e evidencia esperada
- validacao: migration e seed idempotentes, testes de timezone/materializacao, concorrencia de reserva/troca, RBAC negativo e E2E de calendario/remarcacao/deep link.
- evidencia: ocorrencias com snapshot, audit logs antes/depois, relatorio de bookings legados e dashboards sem selecao implicita de time.

## Fora de escopo
Folha de pagamento, ponto eletronico, calculo trabalhista, remuneracao entre colegas e motor RRULE arbitrario.
