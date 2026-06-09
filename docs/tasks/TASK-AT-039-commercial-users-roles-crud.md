# TASK-AT-039 - Commercial users and roles CRUD

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-039-commercial-users-roles-crud.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que um usuario `ADMIN` crie, liste, filtre e edite usuarios comerciais do AlwaysTrack, atribuindo roles comerciais e mantendo os vinculos operacionais de vendedor e supervisor.

## Contexto minimo
A tela atual `Usuarios/Times` ainda mostra o placeholder: "O seed ja cria SAC, financeiro, vendedor e grupo comercial. O CRUD administrativo entra no proximo lote." A `TASK-AT-024` entregou apenas seed comercial parcial, enquanto a mecanica historica SyLembra ja tinha CRUD administrativo com criacao, edicao, ativacao/desativacao, role e reset de senha. Esta task adapta somente o que for util desse padrao para o dominio comercial atual.

## Inputs
- `docs/tasks/TASK-AT-024-commercial-users-teams-seed.md`
- Placeholder `Usuarios/Times` em `apps/web/src/main.tsx`
- Backend atual `services/api/src/core/users/*`
- Modelos comerciais `User`, `SellerProfile` e `SalesGroup` em `services/api/prisma/schema.prisma`
- Referencias historicas: `docs/archive/sylembra/tasks/TASK-USR-001-gestao-usuarios-superiores.md` e `docs/archive/sylembra/tasks/TASK-AUT-002-roles-escopo-acesso.md`

## Dependencias
- satisfeitas: `TASK-AT-013`, `TASK-AT-015`, `TASK-AT-024`
- em aberto: confirmar se `GESTOR` e `FINANCEIRO` permanecem apenas por compatibilidade ou entram em um plano posterior de saneamento de roles comerciais.

## Alvos explicitos
1. `services/api/src/core/users/*`
2. Rotas protegidas `/v1/users` ja existentes ou substituicao equivalente com contrato comercial.
3. `packages/shared/src/index.ts` para contrato de roles exibidas/aceitas, se necessario.
4. `apps/web/src/main.tsx`, substituindo o placeholder `Usuarios/Times` por uma tela administrativa comercial.
5. Vinculos `SellerProfile` e `SalesGroup` no Prisma.
6. Testes de service/handler e validacao manual documentada.

## Fora de escopo
- Reabrir RT, COREN, profissionais, licencas, vencimentos ou regularizacao.
- Recriar a tela legada SyLembra de configuracoes administrativas.
- Implementar cadastro publico, self-service ou convite externo sem padrao existente no backend.
- Criar um sistema novo de permissoes fora dos roles comerciais desta entrega.
- Apagar usuarios com historico operacional; preferir desativacao.

## Roles comerciais aceitas
1. `ADMIN`: administra usuarios comerciais, roles, status e vinculos operacionais.
2. `SAC`: atua no atendimento/revisao operacional conforme acessos comerciais atuais.
3. `VENDEDOR`: usuario comercial com `SellerProfile` criado ou vinculado obrigatoriamente.
4. `SUPERVISOR`: usuario comercial que pode ser vinculado a um ou mais grupos comerciais quando o modelo permitir.

Observacao: `FINANCEIRO` pode aparecer apenas como compatibilidade do seed/estado atual, mas o pedido explicito desta task prioriza `ADMIN`, `SAC`, `VENDEDOR` e `SUPERVISOR`.

## Checklist
1. Mapear o contrato atual de `userRoles`/`commercialUserRoles` e decidir como a tela restringe a criacao aos roles desta task sem quebrar usuarios existentes.
2. Garantir que somente `ADMIN` consiga listar, criar, editar status/role e resetar senha ou enviar convite, conforme padrao ja disponivel no backend.
3. Implementar listagem com filtros minimos por texto, role, status e grupo/vendedor quando aplicavel.
4. Ao criar ou editar usuario `VENDEDOR`, criar ou vincular um `SellerProfile` da mesma organizacao, com nome/email/telefone sincronizados onde fizer sentido.
5. Ao remover role `VENDEDOR`, preservar historico comercial e evitar perda de documentos/ranking; desativar ou desvincular `SellerProfile` somente com regra explicita.
6. Ao criar ou editar usuario `SUPERVISOR`, permitir vinculo/escopo de `SalesGroup` se cabivel, validando organizacao e evitando supervisor fora do tenant.
7. Permitir editar nome, email, telefone, role, status ativo/inativo e vinculos comerciais sem retornar `passwordHash`.
8. Manter reset de senha se o padrao atual for senha inicial/reset direto; usar convite apenas se ja houver contrato backend consolidado.
9. Registrar auditoria para criacao, edicao, mudanca de role/status, vinculo comercial e reset/convite quando o servico de auditoria ja estiver disponivel.
10. Atualizar UI de `Usuarios/Times` usando padroes operacionais existentes, sem reaproveitar textos de RT/licencas.

## Acceptance Criteria
1. `ADMIN` acessa a tela `Usuarios/Times` e ve uma lista filtravel de usuarios comerciais, incluindo role, status e vinculo comercial relevante.
2. `ADMIN` cria usuario `SAC`, `VENDEDOR`, `SUPERVISOR` ou `ADMIN` com validacao de nome, email unico, role aceita e senha/convite conforme contrato existente.
3. Criar usuario `VENDEDOR` cria ou vincula `SellerProfile` da mesma organizacao e impede vendedor sem perfil comercial.
4. Editar usuario para role `VENDEDOR` exige criar/vincular `SellerProfile`; editar para outra role nao perde historico comercial sem regra explicita.
5. Criar ou editar `SUPERVISOR` permite associar grupos comerciais existentes quando cabivel e bloqueia grupos de outra organizacao.
6. `ADMIN` altera status ativo/inativo e role sem conseguir desativar a propria conta atual.
7. Reset de senha ou convite segue o padrao ja existente, nao expoe senha antiga e nao retorna `passwordHash`.
8. Usuarios nao-admin nao acessam o CRUD administrativo.
9. Registros `FINANCEIRO` ja seedados continuam trataveis de forma segura se existirem, mesmo que a criacao priorize as quatro roles desta task.

## Definition of Done
1. Manifesto de implementacao seguido sem expandir para legado SyLembra.
2. Backend valida roles comerciais, tenant, email unico, status e vinculos `SellerProfile`/`SalesGroup`.
3. UI substitui o placeholder por CRUD administrativo funcional e filtravel.
4. Testes cobrem criacao/edicao por role, bloqueio nao-admin, vendedor com `SellerProfile`, supervisor com grupo e reset/convite.
5. Evidencia manual cobre pelo menos criar vendedor, criar supervisor, editar role/status, resetar senha ou convite e filtrar a lista.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/api`, `npm run test --workspace @alwaystrack/api -- users.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: login admin, abrir `Usuarios/Times`, criar `VENDEDOR` com `SellerProfile`, criar `SUPERVISOR` com grupo, alterar status/role, executar reset/convite, conferir bloqueio de usuario nao-admin.

## Evidencia esperada
- Diff backend com contrato comercial de usuarios e vinculos.
- Diff frontend removendo o placeholder de `Usuarios/Times`.
- Testes automatizados e comandos executados.
- Nota manual dos cenarios administrativos exercitados.

## Riscos
- Escalada indevida de role por contrato compartilhado ainda conter `GESTOR`, `FINANCEIRO` e `RT`.
- Quebra de usuarios seedados se `FINANCEIRO` for removido sem compatibilidade.
- Perda de historico comercial se `SellerProfile` for apagado ou desvinculado sem regra clara.
- Supervisor enxergar grupos fora da organizacao se a validacao de tenant ficar incompleta.

## Blockers possiveis
- Falta de decisao sobre `FINANCEIRO`/`GESTOR` no contrato comercial final.
- Ausencia de padrao de convite no backend, exigindo manter reset/senha inicial nesta entrega.
- Necessidade de migracao se o contrato atual de `SellerProfile` nao suportar todos os vinculos esperados.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
