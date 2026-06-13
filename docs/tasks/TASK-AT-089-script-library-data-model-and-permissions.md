# TASK-AT-089 - Scriptoteca: modelo de dados e permissoes

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-089-script-library-data-model-and-permissions.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.1
- dependencias: `TASK-AT-088`

## Objetivo unico
Criar o modelo de dados de scripts/categorias/status e as permissoes canonicas da Scriptoteca.

## Escopo funcional
1. Modelos para categoria e script.
2. Campos minimos: titulo, categoria, canal, texto, tags, status, createdBy, updatedBy, validatedBy, validatedAt.
3. Status iniciais: `DRAFT`, `VALIDATED`, `OBSOLETE`.
4. Permissoes: SAC ve/copia/sugere; Supervisor cria/edita/valida/obsoleta; Admin gerencia tudo.
5. Auditoria para criacao, edicao, validacao e obsolescencia.

## Acceptance Criteria
1. Schema e tipos suportam os campos do MVP.
2. Roles bloqueiam escrita indevida por SAC.
3. Validacao exige Supervisor/Admin.
4. Auditoria registra eventos principais.
5. Seeds podem criar categorias/scripts demo.

## Riscos
- Modelar versionamento completo cedo demais.
- Criar permissoes divergentes da matriz comercial.
