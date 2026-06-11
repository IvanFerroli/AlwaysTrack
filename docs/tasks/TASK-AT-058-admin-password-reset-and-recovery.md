# TASK-AT-058 - Admin password reset and recovery

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-058-admin-password-reset-and-recovery.md

## Modo
- mode: auth-operations

## Objetivo unico
Criar recuperacao de acesso segura para usuarios internos, com reset de senha por admin como MVP e caminho futuro para email tokenizado.

## Contexto minimo
Perguntas de seguranca sao frageis e dificeis de auditar. Para plataforma interna, o caminho mais seguro e simples e permitir que ADMIN redefina senha de usuarios e, depois, evoluir para "esqueci minha senha" por email.

## Inputs
- Politica minima de senha.
- Decisao se email transacional ja sera usado agora ou deixado para fase 2.

## Dependencias
- satisfeitas: CRUD administrativo de usuarios/roles existe.
- em aberto: provider de email transacional, se fase 2 entrar no escopo.

## Alvos explicitos
1. Adicionar acao ADMIN para redefinir senha de usuario.
2. Gerar senha temporaria ou permitir definir senha manual com confirmacao.
3. Exigir troca de senha no proximo login, se o modelo suportar com baixo risco.
4. Auditar reset de senha.
5. Bloquear reset indevido de outro ADMIN sem confirmacao forte.
6. Documentar fluxo operacional.

## Fora de escopo
- Perguntas de seguranca.
- Recuperacao por SMS/WhatsApp.
- Email de reset se nao houver provider configurado.

## Checklist
1. Verificar modelo atual de senha/usuario.
2. Criar endpoint admin de reset.
3. Adicionar acao na tela Usuarios/Times.
4. Adicionar auditoria.
5. Cobrir testes de permissao e hashing.

## Acceptance Criteria
1. ADMIN consegue resetar senha de SAC, VENDAS, SUPERVISOR e usuario comum.
2. Usuario nao-admin nao consegue resetar senha de terceiros.
3. Reset gera evento auditavel.
4. Login com nova senha funciona.

## Definition of Done
1. Fluxo admin entregue e testado.
2. Fase futura de email documentada sem bloquear MVP.
3. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- users.service.test.ts auth.service.test.ts`, `npm run test:all`
- revisao manual: resetar senha e logar com usuario resetado.

## Evidencia esperada
- Teste cobrindo permissao.
- Evento de auditoria visivel/consultavel.

## Riscos
- Reset sem auditoria vira risco operacional.
- Exibir senha temporaria precisa de cuidado para nao vazar em logs.

## Blockers possiveis
- Modelo atual nao ter campo para exigir troca no proximo login.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
