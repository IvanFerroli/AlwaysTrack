# TASK-AT-354 - Retomada de etapa com descarte ou reconfirmacao

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-354-service-flow-rewind-reconfirmation.md

## Objetivo unico
Permitir retomar qualquer etapa visitada com uma escolha explicita entre abandonar o caminho posterior ou preservar seus registros exigindo nova confirmacao sequencial.

## Escopo
- Oferecer `Descartar etapas seguintes` e `Editar e reconfirmar caminho`.
- No descarte, remover passos posteriores materializados e reabrir a etapa alvo.
- Na reconfirmacao, preservar decisoes e notas posteriores, marcando-as como pendentes de reconfirmacao.
- Impedir conclusao da sessao enquanto houver passo pendente ou em reconfirmacao no caminho ativo.
- Auditar estrategia, etapa alvo e quantidade de passos afetados sem dados sensiveis.
- Manter sessao versionada e isolamento por organizacao/usuario.

## Acceptance Criteria
1. O atendente pode retomar qualquer etapa concluida da sessao aberta.
2. Descarte elimina o estado operacional posterior, mas preserva o rastro no Audit Log.
3. Reconfirmacao conserva conteudo e exige nova confirmacao de cada etapa posterior.
4. Um novo ramo nao reaproveita silenciosamente passos de um ramo abandonado.
5. Testes cobrem autorizacao, as duas estrategias, grafo ramificado e bloqueio de finalizacao.

## Dependencias
- TASK-AT-352
- TASK-AT-353

## Validacao
- Testes API para descarte, reconfirmacao, isolamento e sessao encerrada.
- Teste Web para escolha explicita e bloqueio da finalizacao durante reconfirmacao.

## Resultado
- `DISCARD_FOLLOWING` remove o caminho posterior operacional.
- `RECONFIRM_FOLLOWING` preserva decisoes/notas e marca os passos posteriores para nova confirmacao.
- Loops declarados por `allowLoop` reabrem somente o destino previsto; mudanca de ramo continua exigindo descarte explicito.
