# EXEC-AT-109 - Authorization tenancy IDOR regression slice

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-109-authorization-tenancy-idOR-regression-suite.md

## Entrega
Adicionada cobertura de regressao anti-IDOR no slice de upload/autorizacao, focando documentos, DANFE comercial e Wiki anexos sem alterar `app.ts` ou internals de sessao.

## Escopo coberto
1. Documento de outra organizacao nao e lido do storage e retorna erro de permissao.
2. Consulta de DANFE por vendedor inclui organizacao e usuario vendedor no filtro.
3. Download de anexo Wiki permanece limitado por `organizationId` do ator.

## Gaps documentados
- Suite e2e multi-organizacao completa para FAQ, avisos, Scriptoteca, notificacoes e usuarios/configuracoes.
- Cenarios reais de supervisor em ranking/extratos com fixture multi-organizacao.

## Validacao
- `npm run test --workspace @alwaystrack/api -- documents.service.test.ts upload-tokens.service.test.ts sales-documents.service.test.ts wiki.service.test.ts`
- `npm run lint --workspace @alwaystrack/api`
- `git diff --check`

## Risco residual
- Esta entrega e uma fatia de regressao nos dominios tocados; nao substitui a matriz completa da task ampla de autorizacao.
