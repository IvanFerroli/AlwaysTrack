# TASK-AT-360 - Ampliar audiencia SAC da demonstracao

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-360-expand-sac-demo-audience.md

## Objetivo
Disponibilizar usuarios SAC adicionais para demonstrar acompanhamento nominal e conclusao de ciencia em avisos.

## Escopo
- criar `sac2@example.com` e `sac3@example.com` no seed local;
- reutilizar a mesma senha e organizacao de `sac@example.com`;
- manter os tres usuarios ativos e com papel `SAC`;
- documentar as contas na checklist de demonstracao.

## Criterios de aceite
- o seed permanece idempotente;
- as novas contas autenticam com a senha SAC configurada;
- as novas contas integram automaticamente a audiencia de avisos destinados ao SAC.

## Validacao
- seed local executado sem erro;
- login HTTP validado para as duas novas contas;
- typecheck da API aprovado.
