# EXEC-AT-061 - Commercial permission matrix hardening

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-062-role-permission-matrix-hardening.md

## Objetivo
Documentar e reforcar a matriz de permissoes comerciais antes da apresentacao/beta.

## Entregas
1. Criada matriz documentada em `docs/security/commercial-permission-matrix.md`.
2. Criados grupos canonicos em `@alwaystrack/shared`: admin, todos comerciais, gestores, revisores e contribuidores de conhecimento.
3. Criada funcao `canUseCommercialPermission(role, permission)` compartilhada entre API/UI.
4. Rotas comerciais ativas de vendas, campanhas, ranking, extratos, FAQ, Wiki, usuarios, auditoria e notificacoes passaram a usar grupos nomeados.
5. UI de campanhas, ranking, notas e FAQ passou a usar a matriz compartilhada para mostrar/ocultar acoes.
6. Testes de politica cobrem permissoes criticas: vendedor nao revisa, SAC revisa, financeiro nao gerencia campanhas, supervisor gerencia campanhas, gestor nao administra usuarios.

## Decisoes
- `SAC` e `FINANCEIRO` seguem com permissao de revisao de notas nesta fase.
- `GESTOR` nao administra usuarios/integracao Google.
- `SUPERVISOR` pode gerenciar campanhas e FAQ; escopo por grupo permanece nos servicos comerciais.
- Legado SyLembra atras de flag nao foi refatorado nesta leva.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- access-policy.test.ts auth.service.test.ts`

## Riscos residuais
- Escopo fino por grupo de supervisor depende dos filtros ja existentes nos servicos; a matriz de role nao substitui esses filtros.
- Permissoes dinamicas por tenant seguem fora de escopo.
