# TASK-AT-408 - Edicao futura e governanca de Avisos recorrentes

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-408-announcement-future-edits-exceptions-governance.md

## Modo
- mode: implementation

## Objetivo unico
Permitir editar somente ocorrencias futuras por nova versao, cancelar/pular uma data e auditar o impacto antes da confirmacao.

## Contexto minimo
Editar o template de um Aviso recorrente nao pode mudar conteudo ja publicado, recibos ou notificacoes. Gestao tambem precisa corrigir apenas uma ocorrencia sem quebrar a serie.

## Dependencias
- satisfeitas: TASK-AT-404, TASK-AT-406 e TASK-AT-407.
- em aberto: retencao/exibicao de ocorrencia cancelada.

## Alvos explicitos
1. APIs `edit future`, `skip/cancel occurrence`, preview e audit history.
2. UI de regra, calendario de ocorrencias e diff de versao.
3. Integracao com busca, dashboard, ciencia e deep links.

## Fora de escopo
- Editar conteudo/recibos de ocorrencia publicada.
- Apagar ocorrencia cancelada.

## Checklist
1. Exigir effectiveFrom e criar versao nova para mudanca futura.
2. Mostrar ocorrencias que permanecem na versao antiga/nova.
3. Permitir excecao por data com motivo e estado cancelado/pulado.
4. Invalidar materializacao futura stale sem tocar publicada.
5. Auditar diff, ator, regra, datas afetadas e notificacoes canceladas.

## Acceptance Criteria
1. Editar futuro preserva hash/conteudo/receipts das ocorrencias passadas/publicadas.
2. Pular dia 14 ou 29 afeta somente a chave local escolhida.
3. Deep link antigo continua abrindo ocorrencia historica ou fallback seguro.
4. Preview e commit listam o mesmo conjunto de datas afetadas.

## Validacao
- comandos/checks: testes service/HTTP/Web, fake clock, notification resolver, acessibilidade e screenshots.
- revisao manual: editar serie futura, pular uma data e consultar auditoria.

## Riscos
- Corrida entre edicao futura e scheduler materializando a mesma ocorrencia.

## Proximo passo provavel
TASK-AT-409

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: lock/version check entre preview, commit e scheduler.
