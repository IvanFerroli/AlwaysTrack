# EXEC-AT-167 - Fechamento do backlog independente do beta

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-21
- source-of-truth: docs/tasks/EXEC-AT-167-independent-beta-backlog-closure.md

## Objetivo
Fechar itens antigos marcados como parciais que ja tinham implementacoes complementares e reforcar superficies relevantes para o beta sem depender de credenciais ou infraestrutura externa.

## Entregas
1. `TASK-AT-049` consolidada com regressao API por role e gate `beta:preflight`.
2. `TASK-AT-107` encerrada para superficies ativas com as fatias `AT-141/143` reconhecidas.
3. `TASK-AT-101/146/151` consolidadas com anexos genericos, arquivamento auditavel e permissao por superficie.
4. E2E SAC cobre script pessoal privado e sugestao de canonizacao.
5. E2E SAC cobre bloqueio de upload em superficie administrativa.
6. `TASK-AT-020/024/027/054` encerradas pela consolidacao de entregas posteriores e fronteiras tecnicas ja ativas.
7. `TASK-AT-036` recebe regressao Playwright de preview seguro, URL perigosa, toolbar e viewport mobile.

## Validacao
- 25 testes focados de anexos, Scriptoteca e validacao runtime passaram.
- Typecheck API, web e shared passou.
- Playwright listou os quatro cenarios da suite beta sem erro de compilacao.
- Playwright lista tambem o quality gate de navegador da Wiki; a execucao real continua vinculada ao preflight do host.

## Residual externo
- `TASK-AT-166`: execucao integral do preflight no host.
- `TASK-AT-149`: migracao real para Postgres.
