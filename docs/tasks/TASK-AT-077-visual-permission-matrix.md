# TASK-AT-077 - Matriz visual de permissoes

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-077-visual-permission-matrix.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 9
- dependencias: matriz canonica de permissoes ja documentada/implementada.

## Objetivo unico
Criar tela simples e apresentavel mostrando o que SAC, VENDAS, SUPERVISOR e ADMIN podem fazer.

## Contexto
Permissoes visiveis vendem governanca e seguranca operacional para superiores.

## Escopo funcional
1. Tabela/matriz por role e capacidade.
2. Agrupamento por Notas, Ranking, Campanhas, Extratos, Wiki, FAQ, Usuarios, Configuracoes e Auditoria.
3. Legenda clara: pode ver, pode agir, pode administrar.
4. Link/entrada a partir de Configuracoes ou Usuarios/Times.

## Arquivos candidatos
- `apps/web/src/views/settings.tsx`
- `apps/web/src/views/users-teams.tsx`
- `apps/web/src/main.tsx`
- `packages/shared/src/**`
- `docs/architecture/**`

## Plano de execucao
1. Reutilizar matriz canonica existente no shared/docs.
2. Criar componente visual sem duplicar regras manualmente.
3. Exibir por role com linguagem de negocio.
4. Adicionar teste simples se houver contrato novo.

## Acceptance Criteria
1. Matriz reflete permissao real, nao texto solto.
2. Todas as roles comerciais aparecem.
3. A tela e legivel em desktop e apresentavel.
4. Mudancas futuras de permissao tem fonte unica ou documentada.
5. Build web passa.

## Impacto na apresentacao
Ajuda a defender maturidade, controle e separacao de responsabilidades.

## Riscos
- Duplicar matriz visual e regra real, criando divergencia.

## Execucao
- `EXEC-AT-069-visual-permission-matrix.md`
