# TASK-AT-104 - Seguranca: hardening de login, senha e sessao

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-104-auth-session-and-login-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Reduzir risco de conta invadida fortalecendo login, senha, sessao e logout.

## Contexto minimo
O AlwaysTrack usa cookie HTTP-only com token assinado em `services/api/src/core/auth/session.ts`. O cookie tem `maxAge` de 8 horas, `sameSite=lax`, `secure` em producao e assinatura HMAC. Isso e uma boa base.

Gaps que precisam virar produto maduro:
- o payload tem `issuedAt`, mas a validacao atual nao expira o token no parser;
- nao ha rate limit especifico de login;
- nao ha controle de tentativas falhas;
- nao ha rotacao/revogacao de sessao por usuario;
- reset por admin existe, mas politica de senha e trilha de auditoria precisam ser revisadas com olhar de seguranca.

## Inputs
- `services/api/src/core/auth/session.ts`
- `services/api/src/core/auth/auth.handlers.ts`
- `services/api/src/core/auth/auth.service.ts`
- `services/api/src/core/auth/password.ts`
- `services/api/src/core/users/users.service.ts`
- `services/api/prisma/schema.prisma`

## Dependencias
- satisfeitas: auth e reset por admin ja existem.
- em aberto: `TASK-AT-106` para rate limit pode ser executada junto ou antes.

## Alvos explicitos
1. Expiracao validada no servidor para token de sessao.
2. Politica minima de senha para usuarios criados/resetados.
3. Auditoria de login falho, login Google falho, reset de senha e logout.
4. Opcao de invalidar sessoes antigas apos reset de senha.
5. Testes unitarios de sessao expirada e senha fraca.

## Explicacao simples
Cookie `maxAge` pede para o navegador jogar a sessao fora depois de um tempo. Mas um atacante pode tentar reutilizar o valor do cookie diretamente. Por isso o servidor tambem precisa olhar a data dentro do token e dizer: "mesmo que o navegador mande esse cookie, ele venceu".

## Fora de escopo
- MFA/2FA.
- Login sem senha.
- Provedor corporativo SSO completo.

## Checklist
1. Adicionar validade no parser de sessao ou no middleware `requireAuth`.
2. Definir duracao padrao de sessao via env, com limite maximo seguro.
3. Reforcar politica de senha: tamanho minimo, bloquear senha obvia e email como senha.
4. Auditar eventos de sucesso e falha sem vazar senha.
5. Considerar campo `sessionVersion` ou `passwordChangedAt` em `User` para invalidar sessoes antigas.
6. Garantir que reset por admin invalida sessoes existentes.
7. Testar cookie expirado, assinatura invalida, usuario inativo e role invalida.

## Acceptance Criteria
1. Token antigo nao autentica mesmo que assinatura seja valida.
2. Senha fraca e rejeitada em criacao/reset.
3. Reset de senha derruba sessoes anteriores do usuario.
4. Falhas de login sao auditadas/contabilizadas sem revelar motivo sensivel ao usuario final.
5. Google login continua funcionando com dominio permitido.

## Definition of Done
1. Testes de `auth/session` e `auth/service` atualizados.
2. Migration criada se houver campo novo.
3. Docs explicam tempo de sessao e consequencia de reset de senha.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- auth`, `npm run typecheck --workspace @alwaystrack/api`
- revisao manual: login, logout, reset por admin e login Google.

## Evidencia esperada
- Teste demonstrando que sessao expirada falha.
- Teste demonstrando que reset invalida sessao antiga.

## Riscos
- Derrubar usuarios ativos se a regra de expiracao for aplicada errada.
- Quebrar demo local se a politica de senha bloquear seed antigo.

## Blockers possiveis
- Decisao sobre duracao ideal de sessao para ferramenta interna.
- Decisao se senha local continua habilitada quando Google login estiver pronto.

## Retorno esperado
- Resumo da politica final de sessao/senha.
- Instrucoes para configurar envs de sessao em producao.
