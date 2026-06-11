# EXEC-AT-057 - Admin password reset

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- parent-task: TASK-AT-058

## Objetivo
Confirmar e reforcar recuperacao interna de senha por ADMIN.

## Entregas
- Fluxo existente validado: `POST /v1/users/:userId/reset-password`.
- Acao existente validada na tela `Usuarios/Times`.
- Testes reforcados para auditoria do reset e rejeicao de senha invalida.

## Validacao
- `npm run test --workspace @alwaystrack/api -- auth.service.test.ts google-login.service.test.ts users.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`

## Residual
Email de "esqueci minha senha" continua fora do MVP e pode virar fase futura com provider transacional.
