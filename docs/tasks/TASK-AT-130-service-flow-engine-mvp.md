# TASK-AT-130 - Fluxos de atendimento guiado MVP

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-130-service-flow-engine-mvp.md

## Modo
- mode: product-core

## Objetivo unico
Criar a base de Fluxos de Atendimento para transformar conhecimento operacional em jornadas guiadas por tipo de atendimento, com etapas, decisoes e scripts relacionados.

## Contexto
A Scriptoteca resolve "texto pronto", mas o atendimento real muitas vezes exige processo: escolher o caso, seguir perguntas, decidir sim/nao/manual, acionar scripts e consultar Wiki. A nova frente deve funcionar como uma camada menos local e mais transversal que conecta Wiki, Scriptoteca e SAC.

## Escopo MVP
1. Modelo de dados para fluxo, etapas e scripts vinculados.
2. API autenticada para listar, detalhar, criar e atualizar fluxos.
3. Tela `Fluxos` no menu.
4. Leitura operacional por etapa colapsavel.
5. Decisoes simples por etapa: manual, sim/nao, checklist ou decisao.
6. Scripts relacionados por etapa com placeholders e copia.
7. Seed demo de problema de saude/reacao adversa.

## Fora de escopo
- Editor visual drag-and-drop.
- Historico/versionamento completo de fluxos.
- Execucao com checklist salvo por atendimento real.
- Upload de imagens dedicado por etapa.

## Acceptance Criteria
1. SAC consegue selecionar um tipo de atendimento e seguir etapas.
2. Admin/Supervisor consegue cadastrar fluxo basico com etapas e scripts.
3. Cada etapa pode ter scripts relacionados.
4. Copia de script continua auditada.
5. Fluxo publicado fica visivel para roles comerciais.

## Execucao
- execution-log: docs/tasks/EXEC-AT-130-service-flow-engine-mvp.md
