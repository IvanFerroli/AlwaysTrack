# TASK-AT-083 - Avisos: modelo de dados e permissoes

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-083-announcements-data-model-and-permissions.md
- execution: docs/tasks/EXEC-AT-083-announcements-data-model-and-permissions.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.1
- dependencias: `TASK-AT-082`

## Objetivo unico
Definir e implementar a base de dados, permissoes e ciclo de vida dos Avisos.

## Escopo funcional
1. Modelos para aviso, status, prioridade, vigencia, publico alvo e links relacionados.
2. Status minimos: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`, `EXPIRED`.
3. Prioridades minimas: baixa, normal, alta e critica.
4. Publico alvo inicial: todos, roles especificas, vendedores/grupos se viavel.
5. Permissoes canonicas em shared para ver, criar, publicar e arquivar avisos.
6. Migrations e seeds pequenos para ambiente demo/local.

## Acceptance Criteria
1. Schema suporta avisos publicados, rascunhos e expirados.
2. Backend protege criacao/publicacao/arquivamento por role.
3. Usuario comercial comum so ve avisos publicados e vigentes para seu escopo.
4. Typecheck e teste de politica passam.

## Riscos
- Publico alvo granular demais aumentar complexidade; primeira versao deve privilegiar roles e todos.
