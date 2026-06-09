# EXEC-AT-041 - API e2e regression flows

## Metadata
- status: completed
- owner: olympus_orchestrator
- completed-at: 2026-06-09
- tasks: TASK-AT-049

## Entrega
- Projeto Playwright `api` separado dos projetos `desktop`/`mobile`, usando a API e2e em `http://localhost:3334`.
- Regressao HTTP para FAQ: criar thread, comentar, reagir, promover para Wiki, consultar por slug/lista e validar notificacao in-app.
- Regressao HTTP para Usuarios/Times: criar usuario `SAC`, listar usuarios e garantir que `passwordHash` nao vaza no contrato.
- Suite local executavel mesmo quando o browser Playwright esta bloqueado por dependencias de SO.

## Validacao
- `npm run test:e2e -- --project=api`
- `npm run test:all`
- `npm run repo:hygiene`

## Risco residual
- Os fluxos profundos de navegador para upload/revisao DANFE e review Wiki seguem pendentes ate Chromium/deps estarem disponiveis no ambiente local ou CI.
