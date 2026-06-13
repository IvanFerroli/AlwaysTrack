# EXEC-AT-089 - Scriptoteca: modelo de dados e permissoes

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-089-script-library-data-model-and-permissions.md

## Entrega
Criados os modelos `ScriptCategory`, `OperationalScript`, `OperationalScriptRevision` e `OperationalScriptEvent`, com migration dedicada e seed compatível.

## Detalhes
1. Scripts possuem categoria, canal, corpo, tags, placeholders, status, autores, validador e contador de uso.
2. Revisoes guardam snapshot textual e comentario de alteracao.
3. Eventos registram criacao, atualizacao, validacao, obsolescencia e copia.
4. Permissoes adicionadas em `packages/shared`: `scriptLibrary.read`, `scriptLibrary.copy` e `scriptLibrary.manage`.

## Validacao
- Prisma generate executado via typecheck/migration gate.
- Migration validada em banco vazio, seedado e restaurado.
