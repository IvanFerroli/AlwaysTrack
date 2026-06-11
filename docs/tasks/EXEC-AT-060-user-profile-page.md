# EXEC-AT-060 - User profile page

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-059-user-profile-page.md

## Objetivo
Criar uma pagina de perfil para identidade basica do usuario interno e historico de notificacoes.

## Entregas
1. Adicionado `avatarUrl` ao modelo `User` com migracao dedicada.
2. Criado contrato `GET /v1/profile` com dados do usuario, organizacao, vendedor/grupo e conexao Google.
3. Criado contrato `PATCH /v1/profile` para atualizar somente nome, telefone e avatar.
4. Atualizado `CurrentUser`, login e middleware para carregar `avatarUrl`.
5. Criada view `ProfileView` com avatar/iniciais, dados somente leitura, formulario de perfil e historico de notificacoes.
6. Perfil acessivel pela sidebar e pelo botao de usuario no topo.
7. Historico de notificacoes permite filtrar por lida/nao lida/tipo e marcar notificacoes como lidas.
8. Testes garantem que email/role/organizacao nao entram no payload de autoatendimento.

## Decisoes
- Avatar nesta leva e URL validada ou fallback por iniciais, sem upload binario.
- Troca de senha propria fica fora desta execucao; reset por admin ja existe e login Google precisa de desenho separado.

## Validacao
- `npm run prisma:generate`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- users.service.test.ts auth.service.test.ts notifications.service.test.ts`

## Riscos residuais
- Historico de notificacoes ainda usa limite atual do endpoint in-app, sem paginacao profunda.
- Upload de avatar real deve ser implementado futuramente com storage, MIME e tamanho validados.
