# EXEC-AT-069 - Matriz visual de permissoes

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- source-task: `TASK-AT-077-visual-permission-matrix.md`

## Resumo
Criada matriz visual de permissoes em Configuracoes, usando a fonte canonica `commercialPermissionMatrix` de `@alwaystrack/shared`.

## Implementacao
1. Adicionada secao "Matriz de permissoes" na tela de Configuracoes.
2. Listadas roles comerciais: Admin, Gestor, Supervisor, SAC, Financeiro e Vendas.
3. Agrupadas capacidades por Notas, Ranking, Campanhas, Extratos, Wiki, FAQ, Usuarios, Auditoria, Perfil e Notificacoes.
4. Criada legenda visual para "Pode ver", "Pode agir" e "Administra".
5. Evitada duplicacao de regra: cada celula consulta `commercialPermissionMatrix`.

## Arquivos principais
- `apps/web/src/views/settings.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/TASK-AT-077-visual-permission-matrix.md`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run build --workspace @alwaystrack/web`

## Riscos e proximos passos
- A matriz visual depende da lista curada de capacidades para textos de negocio, mas a permissao real vem do shared.
- Mudancas futuras em permissoes devem atualizar `commercialPermissionMatrix` e revisar os labels se uma nova capacidade for criada.

