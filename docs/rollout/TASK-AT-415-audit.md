# TASK-AT-415 - Auditoria de rollout de Escalas e Avisos recorrentes

## Metadata
- status: audit-complete-no-go-production
- owner: olympus_orchestrator
- audited-at: 2026-07-18
- evidence-class: local/fake
- source-of-truth: docs/rollout/TASK-AT-415-audit.md

## Decisao
- Demo local do subconjunto implementado com seed ficticio: **GO**.
- Rollout interno/externo: **NO-GO** ate fechar os gates production-like e humanos abaixo.

## Evidencia local observada
- Schema Prisma validado e client gerado.
- Banco vazio criado pelo schema final; seed concluiu com tres SAC ficticios.
- Scheduler executado duas vezes: primeira criou 5 ocorrencias; segunda criou 0 e pulou 5, sem falhas.
- Testes focados de Escalas, Pausas, Avisos, notificacoes e contratos HTTP passaram.
- Suite completa local: API com 892 testes aprovados e 1 skip intencional de Redis; Web com 115 testes aprovados.
- Coverage local: API 80,72% de linhas/statements, 66,99% de branches e 81,20% de funcoes; Web 56,53% de linhas/statements, 75,38% de branches e 54,84% de funcoes.
- Handlers de Escalas e series recorrentes atingiram 100% de linhas e funcoes nos testes focais.
- Cinco planos SAC do Artillery cobrem leitura, cobertura, materializacao idempotente, burst de 12 candidaturas e recorrencia concorrente. Schema/hooks e oito guardas estaticos passaram; nenhuma carga foi executada.
- API e Web passaram em typecheck; Web passou em build de producao.
- Playwright descobriu 41 testes e o projeto API passou 13/13. Os quatro cenarios SAC novos cobrem mobile, fronteiras de escrita, GESTOR e ciencia nominal de Aviso; o navegador nao iniciou neste host.
- O worker externo processa todas as organizacoes, usa claim compare-and-set com lease, falha fechado por canal/template e aplica webhook monotonicamente por `(provider, providerMessageId)` unico.
- Jobs, cron, observabilidade, runbook e rollback foram versionados.
- Troca de Pausa usa lock exclusivo por booking, compare-and-set e testes locais/simulados; isso nao constitui evidencia PostgreSQL.
- KPIs ponderados e Campanhas SAC governadas permanecem na baseline anterior e possuem testes locais versionados; nao foram reimplementados por TASK-AT-391..416.

## Requisitos cobertos localmente
| Requisito | Resultado |
| --- | --- |
| Regra/padrao/atribuicao versionados | PARTIAL local: versao direta; sem draft/diff/archive |
| Materializacao idempotente | PASS local sob acionamento manual; sem job de horizonte |
| Extra e troca com aprovacao hibrida | PASS local; concorrencia PostgreSQL pendente |
| Tenancy/RBAC e equipe explicita | PASS local |
| Pausa dentro do turno efetivo | PASS local com dual-read transitório |
| Reagendamento explicito e auditado | PASS local |
| Troca atomica de Pausa | PASS local/simulado; PostgreSQL pendente |
| Deep link de notificacao | PARTIAL local: parser Web; sem resolver backend |
| Recorrencia 14/29 e fevereiro `SKIP` | PASS local |
| Edicao somente futura | PASS local; preview/diff pendente |
| Observabilidade e procedimento de disable | PASS documental/local |
| KPIs ponderados e Campanhas SAC | PASS local de regressao da baseline |

## Blockers para promocao
1. Replay completo das migrations historicas segue bloqueado pela falha preexistente `20260529162000_wiki_collaborative_review`.
2. SQLite nao prova as garantias de concorrencia esperadas para operacao sustentada.
3. Falta executar corrida real de candidatura, troca e reserva em PostgreSQL production-like.
4. Falta rehearsal autorizado de backup, restore, disable do scheduler e retomada sem duplicidade.
5. Falta validar notificacoes/deep links, timezone do host e polling com papeis reais no ambiente alvo.
6. O E2E de navegador de Escalas esta versionado e listado, mas nao executou neste host por ausencia de `libnspr4.so` no Chromium headless. Isso nao bloqueia a demo manual; bloqueia usar esse run como evidencia automatizada.
7. Faltam resolver backend/persistencia de target tipado de notificacao e fallback autorizado para entidade indisponivel.
8. Faltam excecoes completas, draft/diff/archive de regra, job de horizonte de Escalas e flags independentes por frente.
9. Seed e E2E ainda nao cobrem SUPERVISOR, trocas/remarcacao completas, axe, baselines visuais e todos os cenarios stale; SAC mobile e GESTOR possuem cenarios versionados.
10. Faltam carga real, stress/spike/soak e alertas exercitados no ambiente alvo.
11. Um crash depois do aceite do provedor e antes da persistencia ainda pode reenviar a mensagem se o provedor nao honrar idempotencia; o lease local nao elimina essa janela externa.

## Abort e rollback
- Abortar se houver ocorrencia duplicada, publicacao antecipada, atraso acima de dez minutos, vazamento entre equipes ou pausa fora do turno.
- Desligar primeiro as mutacoes/scheduler; manter leitura e historico.
- Arquivar series, nao apagar ocorrencias.
- Reconciliar pausas conflitadas antes de remover a fonte de escala.
- Voltar imagem de aplicacao sem downgrade destrutivo do schema.

## Condicao para reauditoria
Anexar ambiente, commit, horario UTC, operador, banco, comandos, resultados, backup/restore e evidencias redigidas de concorrencia e rollback. Evidencia local/fake nao promove este gate.
