# TASK-AT-375 - Aprovacao e correcao versionada de Performance SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-375-sac-performance-approval-revisions.md

## Modo
- mode: implementation

## Objetivo unico
Governar submissao, revisao, aprovacao, rejeicao e correcao sem sobrescrever valores publicados.

## Contexto minimo
Performance manual precisa de provenance e maker-checker. Edicao in-place destruiria o numero que sustentou dashboard ou campanha anterior.

## Dependencias
- satisfeitas: TASK-AT-374 e TASK-AT-364.
- em aberto: n/a.

## Alvos explicitos
1. State machine DRAFT/SUBMITTED/APPROVED/REJECTED/SUPERSEDED.
2. APIs e fila Web de revisao.
3. Revisoes imutaveis e auditoria antes/depois.

## Fora de escopo
- Aprovar automaticamente por confianca.
- Excluir versao publicada.

## Checklist
1. Impedir aprovacao propria, salvo override emergencial explicitamente governado.
2. Exigir motivo em rejeicao, correcao e supersedencia.
3. Criar nova versao ligada a anterior para toda correcao publicada.
4. Atualizar visao corrente de forma atomica e idempotente.
5. Notificar submitter/reviewer sem duplicacao.

## Acceptance Criteria
1. Apenas APPROVED alimenta agregados oficiais e campanhas.
2. Historico permite reconstruir cada valor publicado e decisao.
3. Rejeicao nao apaga draft; correcao nao muda versao antiga.
4. Maker-checker, tenant e time sao validados no service.

## Validacao
- comandos/checks: testes de state machine, RBAC, auditoria, notificacao e Web.
- revisao manual: submeter, rejeitar, aprovar e corrigir o mesmo periodo.

## Riscos
- Duas aprovacoes concorrentes criarem duas versoes correntes.

## Proximo passo provavel
TASK-AT-376

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nenhuma mutacao destrutiva de versao publicada.
