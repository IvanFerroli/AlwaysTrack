# TASK-AT-361 - Resumo vivo para handoff do atendimento

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-361-live-service-flow-handoff-summary.md

## Objetivo
Manter um resumo copiavel durante todo o atendimento para permitir troca de responsavel sem perda de contexto.

## Escopo
- exibir o resumo desde o inicio da sessao na coluna lateral, abaixo da ficha;
- atualizar o texto com as decisoes e notas retornadas a cada passo;
- permitir copia tanto durante o percurso quanto depois da conclusao;
- distinguir visualmente resumo `Parcial` de resumo `Final`;
- preservar as validacoes e o comando explicito de conclusao do atendimento.

## Criterios de aceite
- uma sessao aberta sempre apresenta ao menos a identificacao do fluxo;
- decisoes e notas concluidas aparecem no resumo sem aguardar o encerramento;
- o resumo parcial e copiavel e nao se apresenta como conclusao definitiva;
- a conclusao troca o estado visual para `Final` sem alterar o conteudo deterministico;
- o bloco permanece abaixo da ficha na coluna lateral.

## Validacao
- teste Web cobre exibicao e copia parcial e transicao para o resumo final;
- typecheck e build Web aprovados;
- integridade documental e `git diff --check` aprovados.
