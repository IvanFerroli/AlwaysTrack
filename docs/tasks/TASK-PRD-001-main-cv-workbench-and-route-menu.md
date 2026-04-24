# TASK-PRD-001 - Main CV workbench e menu de rotas

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-PRD-001-main-cv-workbench-and-route-menu.md

## Modo
- mode: runtime

## Objetivo unico
Materializar uma superficie operacional unica para navegar pelas rotas e criar resume profile a partir do Main CV em `doc/*.txt`, sem abrir escopo de logica funcional pesada.

## Contexto minimo
O projeto ja possui pipeline funcional de ingestao/matching/aprovacao, mas faltava ergonomia para inspecao de rotas e um fluxo objetivo para transformar o CV principal em skills aplicaveis ao matching.

## Inputs
- CVs do usuario em `doc/EN-CV_IVANILSON_FERREIRA_2026.txt` e `doc/PT-CV_IVANILSON_FERREIRA_2026.txt`
- runtime local existente (`apps/web`, `services/api`)

## Dependencias
- satisfeitas: TASK-RTM-001, TASK-CTR-001, TASK-QLT-001, TASK-QLT-002
- em aberto: n/a

## Alvos explicitos
1. `services/api/src/features/resume-profiles/*`
2. `services/api/src/main.ts`
3. `apps/web/src/features/home/render-home.ts`
4. `apps/web/src/features/dashboard/load-dashboard.ts`
5. `apps/web/src/features/ingestion/submit-job.ts`
6. `apps/web/src/main.ts`
7. `packages/shared-types/src/index.ts`

## Fora de escopo
- OCR/parse de `.pdf` e `.docx`
- persistencia em banco de dados
- avaliacao semantica avancada por LLM externa

## Checklist
1. Expor fontes de CV `.txt` via API.
2. Expor endpoint de analise do Main CV e criacao de resume profile.
3. Adicionar menu de botoes para rotas no dashboard web.
4. Adicionar formulario Main CV Analyzer no dashboard web.
5. Validar com `npm run check`, `npm run build` e smoke HTTP.

## Acceptance Criteria
1. `GET /v1/main-cv/sources` retorna lista de arquivos `.txt` em `doc/`.
2. `POST /v1/main-cv/analyze` cria resume profile com skills extraidas + extras manuais.
3. Dashboard web mostra painel "Route Menu" com botoes de acesso rapido.
4. Dashboard web mostra painel "Main CV Analyzer" funcional.

## Definition of Done
1. Fluxo API e web testado em ambiente local com evidencias observaveis.
2. Quality gates verdes (`lint`, `typecheck`, `test`, `build`).

## Validacao
- comandos/checks: `npm run check`, `npm run build`
- revisao manual:
  - abrir `http://localhost:3000`
  - executar `Main CV Analyzer`
  - confirmar novo profile em `GET /v1/resume-profiles`

## Evidencia esperada
- resposta positiva de `GET /v1/main-cv/sources`
- resposta positiva de `POST /v1/main-cv/analyze`
- redirect de sucesso em `POST /main-cv/analyze`

## Riscos
- heuristica de extracao depende da estrutura textual do CV `.txt`
- dados permanecem volateis por usar store em memoria

## Blockers possiveis
- ausencia de arquivo `.txt` em `doc/`
- formato de CV fora do padrao de linhas de stack

## Feedback obrigatorio de retorno
- confirmar se o parser deve priorizar EN, PT ou ambos por padrao
- confirmar se voce quer persistencia do "main profile" em storage duravel no proximo ciclo
