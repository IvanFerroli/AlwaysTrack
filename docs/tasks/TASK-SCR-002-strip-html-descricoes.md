# TASK-SCR-002 - Strip HTML das descricoes antes da tokenizacao

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-24
- source-of-truth: docs/tasks/TASK-SCR-002-strip-html-descricoes.md

## Modo
- mode: runtime
- generation-mode: pipeline kickoff

## Capability
- job-scraping

## Origem documental
- VER-SCR-001: ponto de atencao registrado — normalizedTokens capturando tags HTML brutas
- TASK-SCR-001 concluida (base existente)

## Objetivo unico
Remover tags HTML das descricoes de vagas no parser do scraper antes de passar para o IngestionService,
melhorando a qualidade dos normalizedTokens e consequentemente a precisao do match score.

## Contexto minimo
O scraper (TASK-SCR-001) entrega descricoes em HTML bruto da Remotive.
O IngestionService tokeniza a description diretamente, capturando tags como "ul", "li", "img", "src".
Isso polui o match score — skills como "python" podem nao bater porque o token set esta cheio de ruido HTML.

## Inputs
- `services/api/src/features/scraper/scraper.parser.ts` (existente)
- Descricoes HTML da Remotive e Arbeitnow

## Dependencias
- satisfeitas: TASK-SCR-001
- em aberto: n/a

## Alvos explicitos
1. `services/api/src/features/scraper/scraper.parser.ts` — adicionar funcao stripHtml antes de passar description

## Fora de escopo
- Mudar logica de tokenizacao do IngestionService
- Parsear markdown ou outros formatos
- Alterar qualquer outro modulo alem do parser do scraper

## Checklist
1. Implementar funcao `stripHtml(raw: string): string` no parser usando regex simples (sem deps externas)
2. Aplicar stripHtml na description antes de montar IngestJobPostingInput
3. Rodar `npm run check`
4. Smoke: `POST /v1/scraper/run` + checar que tokens em `GET /v1/job-postings` nao tem "ul", "li", "img"

## Acceptance Criteria
1. `normalizedTokens` de vagas ingeridas pos-fix nao contem "ul", "li", "img", "src", "href", "strong", "p"
2. `npm run typecheck` verde
3. `npm run lint` verde

## Definition of Done
1. Funcao stripHtml aplicada no parser
2. Quality gates verdes
3. Smoke confirmado

## Validacao
- `npm run check`
- `curl -X POST http://localhost:3001/v1/scraper/run` + inspecionar tokens da primeira vaga

## Evidencia esperada
- Tokens sem tags HTML na resposta de GET /v1/job-postings
- npm run check sem erros

## Riscos
- Regex de strip pode remover conteudo util se a descricao usar `<` em contexto nao-HTML

## Blockers possiveis
- nenhum

## Feedback obrigatorio de retorno
- n/a — escopo claro e fechado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: parser modificado, check verde, smoke confirmado
- constraints: tocar apenas scraper.parser.ts
