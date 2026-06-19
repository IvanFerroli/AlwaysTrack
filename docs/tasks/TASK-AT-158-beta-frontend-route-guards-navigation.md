# TASK-AT-158 - Frontend route guards e navegacao por role beta

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-158-beta-frontend-route-guards-navigation.md

## Modo
- mode: implementation

## Objetivo unico
Condicionar sidebar, topbar, atalhos e acesso manual por URL conforme matriz beta.

## Contexto minimo
O backend bloqueia a seguranca real, mas a UX do beta deve evitar que SAC e VENDEDOR vejam telas fora do perfil. A navegacao deve comunicar fronteiras sem parecer sistema quebrado.

## Inputs
- `TASK-AT-154`
- `TASK-AT-156`

## Dependencias
- satisfeitas: matriz e backend hardening.
- em aberto: n/a.

## Alvos explicitos
1. `apps/web/src`
2. componentes de layout/sidebar/topbar
3. views criticas: Notas, Ranking, Extratos, Campanhas, Usuarios/Times, Configuracoes, Auditoria

## Fora de escopo
- Criar nova identidade visual.
- Alterar regras backend.

## Checklist
1. Criar/usar helper frontend de permissoes por role.
2. Esconder menus indevidos por role.
3. Bloquear URL manual com estado/redirect apropriado.
4. SAC ve apenas Wiki, FAQ, Avisos, Scriptoteca, Fluxos, Perfil e Busca escopada.
5. VENDEDOR ve conhecimento, Perfil e proprios dados comerciais permitidos.
6. Admin/Gestor/Financeiro/Supervisor preservam experiencias conforme matriz.

## Acceptance Criteria
1. SAC nao enxerga itens comerciais/admin na navegacao.
2. VENDEDOR nao enxerga administracao/auditoria/integracoes.
3. URL manual fora da role nao renderiza tela sensivel.
4. UX mostra acesso negado/volta segura quando necessario.

## Definition of Done
1. Navegacao alinhada a matriz.
2. Typecheck web passando.
3. Smoke manual por SAC e VENDEDOR documentado.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`.
- revisao manual: logar como SAC, VENDEDOR e ADMIN.

## Evidencia esperada
- Prints ou checklist de menus por role.
- Lista de rotas frontend bloqueadas.

## Riscos
- Esconder menu mas quebrar deep link legitimo.
- Duplicar matriz de permissoes em muitos arquivos.

## Blockers possiveis
- Matriz frontend/backend sem fonte compartilhada.

## Retorno esperado
- resumo curto da UX por role
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
