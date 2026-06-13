# TASK-AT-094 - Scriptoteca: historico e versionamento simples

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-094-script-library-version-history.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.6
- dependencias: `TASK-AT-093`

## Objetivo unico
Registrar versoes anteriores e comentarios de alteracao dos scripts.

## Escopo funcional
1. Criar revisao a cada alteracao relevante. Status: entregue no backend.
2. Guardar texto anterior, status anterior e autor. Status: entregue no backend.
3. Exibir historico no detalhe do script. Status: entregue.
4. Permitir restauracao apenas para Admin se couber. Status: entregue.
5. Auditoria de restauracao. Status: entregue.

## Acceptance Criteria
1. Alteracao de script gera revisao.
2. Historico mostra quem alterou e quando.
3. Comentario de alteracao aparece quando informado.
4. Admin consegue auditar mudancas antigas.
5. Versao atual continua clara.

## Riscos
- Criar diff visual complexo antes da hora.
- Guardar historico grande sem paginacao.

## Execucao
- execution-log: docs/tasks/EXEC-AT-094-script-library-version-history.md
