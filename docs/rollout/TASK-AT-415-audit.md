# TASK-AT-415 - Auditoria de rollout de Escalas e Avisos recorrentes

## Metadata
- status: audit-complete-no-go-production
- owner: olympus_orchestrator
- audited-at: 2026-07-18
- evidence-class: local/fake
- source-of-truth: docs/rollout/TASK-AT-415-audit.md

## Decisao
- Demo local com seed ficticio: **GO**.
- Rollout interno/externo: **NO-GO** ate fechar os gates production-like e humanos abaixo.

## Evidencia local observada
- Schema Prisma validado e client gerado.
- Banco vazio criado pelo schema final; seed concluiu com tres SAC ficticios.
- Scheduler executado duas vezes: primeira criou 5 ocorrencias; segunda criou 0 e pulou 5, sem falhas.
- Testes focados de Escalas, Pausas, Avisos, notificacoes e contratos HTTP passaram.
- API e Web passaram em typecheck; Web passou em build de producao.
- Jobs, cron, observabilidade, runbook e rollback foram versionados.

## Requisitos cobertos localmente
| Requisito | Resultado |
| --- | --- |
| Regra/padrao/atribuicao versionados | PASS local |
| Materializacao idempotente | PASS local |
| Extra e troca com aprovacao hibrida | PASS local |
| Tenancy/RBAC e equipe explicita | PASS local |
| Pausa dentro do turno efetivo | PASS local |
| Reagendamento explicito e auditado | PASS local |
| Deep link de notificacao | PASS local |
| Recorrencia 14/29 e fevereiro `SKIP` | PASS local |
| Edicao somente futura | PASS local |
| Observabilidade e procedimento de disable | PASS documental/local |

## Blockers para promocao
1. Replay completo das migrations historicas segue bloqueado pela falha preexistente `20260529162000_wiki_collaborative_review`.
2. SQLite nao prova as garantias de concorrencia esperadas para operacao sustentada.
3. Falta executar corrida real de candidatura, troca e reserva em PostgreSQL production-like.
4. Falta rehearsal autorizado de backup, restore, disable do scheduler e retomada sem duplicidade.
5. Falta validar notificacoes/deep links, timezone do host e polling com papeis reais no ambiente alvo.

## Abort e rollback
- Abortar se houver ocorrencia duplicada, publicacao antecipada, atraso acima de dez minutos, vazamento entre equipes ou pausa fora do turno.
- Desligar primeiro as mutacoes/scheduler; manter leitura e historico.
- Arquivar series, nao apagar ocorrencias.
- Reconciliar pausas conflitadas antes de remover a fonte de escala.
- Voltar imagem de aplicacao sem downgrade destrutivo do schema.

## Condicao para reauditoria
Anexar ambiente, commit, horario UTC, operador, banco, comandos, resultados, backup/restore e evidencias redigidas de concorrencia e rollback. Evidencia local/fake nao promove este gate.
