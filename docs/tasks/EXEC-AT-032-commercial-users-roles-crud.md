# EXEC-AT-032 - Commercial users and roles CRUD

## Metadata
- execution-id: EXEC-AT-032
- task: TASK-AT-039-commercial-users-roles-crud.md
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-09

## Objetivo
Substituir o placeholder `Usuarios/Times` por um CRUD administrativo comercial para usuarios, roles e vinculos operacionais de vendedor/supervisor.

## Arquivos alterados
1. `services/api/src/core/users/users.service.ts`
2. `services/api/src/core/users/users.handlers.ts`
3. `services/api/src/core/users/users.service.test.ts`
4. `services/api/src/app.ts`
5. `apps/web/src/main.tsx`
6. `docs/tasks/TASK-AT-039-commercial-users-roles-crud.md`
7. `docs/tasks/ROADMAP.md`
8. `docs/operations/orchestrator-state.md`

## Entrega
1. Backend de usuarios agora retorna `sellerProfile` e `supervisedSalesGroups` na listagem administrativa.
2. Criacao nova aceita `ADMIN`, `SAC`, `VENDEDOR` e `SUPERVISOR`.
3. Criar usuario `VENDEDOR` cria ou reativa `SellerProfile` na organizacao do admin, com codigo, nome comercial e grupo quando informados.
4. Editar usuario para `VENDEDOR` sincroniza o `SellerProfile` sem apagar historico comercial.
5. Editar usuario `SUPERVISOR` com grupo comercial atualiza `SalesGroup.supervisorId`.
6. Novo endpoint `GET /v1/users/commercial-options` entrega grupos comerciais e vendedores para a UI.
7. Tela `Usuarios/Times` ganhou filtros por busca, funcao, status e grupo.
8. Tela permite criar usuario comercial, editar inline em painel, ativar/desativar e resetar senha.

## Decisoes
- `FINANCEIRO` e `GESTOR` continuam visiveis/editaveis como compatibilidade via contrato compartilhado, mas criacao nova prioriza as quatro roles pedidas: `ADMIN`, `SAC`, `VENDEDOR` e `SUPERVISOR`.
- Remocao de role `VENDEDOR` nao apaga `SellerProfile`, preservando historico de notas/ranking.
- Reset de senha segue o contrato existente de senha inicial/manual; convite externo ficou fora desta entrega.

## Validacao
- `npm run test --workspace @alwaystrack/api -- users.service.test.ts`: passou, 7 testes.
- `npm run typecheck --workspace @alwaystrack/api`: passou.
- `npm run typecheck --workspace @alwaystrack/web`: passou.
- `npm run build --workspace @alwaystrack/web`: passou.
- `npm run check`: passou, 26 arquivos de teste e 161 testes.

## Riscos residuais
- Ainda nao ha multi-grupo para um unico supervisor; o modelo atual permite um `supervisorId` por grupo, e a UI vincula um grupo por edicao.
- Reset de senha usa prompt do navegador por ser o padrao existente mais curto; uma modal dedicada pode melhorar UX depois.
