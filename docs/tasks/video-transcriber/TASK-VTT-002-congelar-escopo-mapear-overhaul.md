# TASK-VTT-002 - Congelar escopo e mapear overhaul

## Metadata
- status: completed
- owner: product-planner
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-002-congelar-escopo-mapear-overhaul.md

## Modo
- mode: planning

## Agentes sugeridos
- `olympus_taskyfier`
- `olympus_orchestrator`
- `olympus_scope_guard`

## Objetivo unico
Transformar o documento central em um contrato de escopo executavel para a V1 local.

## Contexto minimo
O documento central e intencionalmente restritivo: Python, CLI local, um arquivo por vez, `faster-whisper`, CPU primeiro, saida `.txt` simples. Esta task impede que o overhaul herde frontend/API/banco do projeto atual.

## Inputs
- `doc/documento-central-local-video-to-txt-transcriber.md`
- inventario de arquivos do repositorio atual
- `docs/tasks/video-transcriber/ROADMAP.md`

## Dependencias
- satisfeitas: `TASK-VTT-001`
- em aberto: n/a

## Alvos explicitos
1. lista de arquivos a manter, mover ou remover
2. lista de guardrails da V1
3. criterios de aceite consolidados

## Fora de escopo
- editar codigo de runtime
- instalar dependencias
- adicionar features futuras

## Checklist
1. Extrair requisitos positivos da V1.
2. Extrair itens explicitamente fora de escopo.
3. Classificar artefatos atuais como manter/remover/decidir.
4. Definir criterio para considerar o overhaul completo.
5. Registrar riscos de regressao e rollback.

## Acceptance Criteria
1. O executor sabe exatamente o que deve existir na arvore final.
2. O executor sabe exatamente o que nao pode ser adicionado.
3. A remocao de artefatos antigos exige confirmacao se for destrutiva.

## Definition of Done
1. Escopo V1 fechado em linguagem operacional.
2. Roadmap de tasks aprovado como sequencia de execucao.
3. Nenhuma dependencia futura, como GPU ou API paga, virou requisito de V1.

## Validacao
- comandos/checks: `rg --files`
- revisao manual: comparar escopo contra secoes 2, 11, 13 e 18 do documento central

## Evidencia esperada
- lista de guardrails
- lista de artefatos finais esperados

## Execucao
1. Documento central lido integralmente.
2. Guardrails registrados em `docs/tasks/video-transcriber/README.md`.
3. Roadmap executivo registrado em `docs/tasks/video-transcriber/ROADMAP.md`.
4. Backlog granular registrado em `docs/tasks/video-transcriber/BACKLOG.md`.
5. Tasks executaveis `TASK-VTT-001` ate `TASK-VTT-010` criadas.
6. Matriz concreta de manter/criar/remover/decidir registrada em `docs/tasks/video-transcriber/OVERHAUL-FILE-MATRIX.md`.

## Riscos
- escopo crescer durante implementacao
- remover documentacao util sem necessidade

## Blockers possiveis
- decisao pendente sobre converter repo atual ou criar repo novo

## Retorno esperado
- contrato de escopo
- mapa de arquivos
- autorizacao para scaffold
