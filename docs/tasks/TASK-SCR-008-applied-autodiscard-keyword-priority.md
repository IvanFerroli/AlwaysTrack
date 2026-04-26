# TASK-SCR-008 - Sanidade pos-scraper: applied inesperado, auto-discard score 0 e prioridade por keyword

## Metadata
- id: TASK-SCR-008
- titulo: Corrigir sanidade do pos-scraper para status aplicado indevido, descarte incompleto e prioridade de keyword no ranking
- capability: job-scraping + job-matching
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-008-applied-autodiscard-keyword-priority.md

## Modo
- mode: pipeline kickoff (compact docs-first)

## Objetivo unico
Garantir que a rodada de scraper produza lista priorizada e confiavel: sem `applied` inesperado, com auto-discard consistente para vagas sem afinidade (score 0) e com keyword influenciando explicitamente a ordenacao no topo.

## Contexto minimo
- TASK-SCR-007 consolidou keyword robusta e auto-discard inicial, mas o uso real reportou 3 desvios:
  1. vagas chegando/parecendo `applied` sem acao humana;
  2. vagas de score 0 nao sendo descartadas de forma consistente;
  3. keyword com influencia fraca na visibilidade final.

## Inputs
- runtime atual do scraper/ranking pos TASK-SCR-007
- comportamento observado no dashboard apos rodar scraper
- memoria operacional vigente em `docs/operations/taskyfier-memory.md`

## Dependencias
- satisfeitas:
  - pipeline kickoff + single-turn pipeline mode ativos
  - execution artifact mode + verificacao anti-narrativa ativos
  - Prisma/Postgres e rotas de scraper/ranked operacionais
- em aberto:
  - regra canonica explicita de precedencia final de ordenacao (afinidade vs keyword)

## Escopo desta task
1. Sanidade de status `applied`:
- validar e corrigir o fluxo para que `applied` so seja atribuida por acao humana explicita (nao por ingestao/scraper/default).

2. Auto-discard consistente para score 0:
- garantir regra unica e observavel para vagas sem match (score 0 / sem skills encontradas), com tag removivel e reversibilidade operacional.

3. Prioridade por keyword no ranking:
- quando keyword for fornecida na rodada/filtro, vagas com match de keyword devem ganhar prioridade de ordenacao no topo (sem quebrar dedupe nem status gates).

4. Evidencia e rastreabilidade:
- atualizar report de execucao com contadores/indicadores para os 3 pontos.
- atualizar estados operacionais no retorno do ciclo.

## Fora de escopo
- scraping autenticado com captcha/anti-bot
- novos provedores/plataformas
- mudanca canonica de arquitetura
- automacao de candidatura final

## Acceptance Criteria
- AC1: apos `POST /v1/scraper/run`, nenhuma vaga nova entra como `applied` sem endpoint/acao humana especifica de apply.
- AC2: vagas sem afinidade efetiva (score 0 e sem matched skills) ficam auto-descartadas de forma consistente e observavel.
- AC3: com keyword informada (ex.: `junior`, `pleno`, `react`), jobs com match de keyword sobem no topo de `GET /v1/jobs/ranked`.
- AC4: report de execucao mostra evidencias dos 3 pontos (status sanitizado, autoDiscarded consistente, impacto de keyword na ordenacao).
- AC5: verifier aprova apenas com artefato material + evidencias observaveis.

## Definition of Done
- patch de codigo objetivo (scraper/ingestion/match/ranking e UI apenas se estritamente necessario)
- testes atualizados para cobrir os 3 cenarios
- gates locais verdes (`typecheck`, `lint`, `test`)
- execution + verification reports materializados em `docs/tasks/`
- updates em `docs/operations` propostos/aplicados no ciclo

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- execution_mode_required: single-turn pipeline mode
- specialist_expected: olympus-runtime-builder
- specialist_support: olympus-quality-builder
- constraints:
  - nao abrir escopo fora de sanidade pos-scraper/ranking
  - nao criar kit novo
  - nao quebrar canônico vigente
  - manter compact docs-first mode (chat curto, detalhe em docs)
- expected_artifacts:
  - patch material dos fluxos afetados
  - execution report com evidencia observavel
  - pacote para task verifier com classificacao final e update de estados

## Retorno esperado do ciclo
- task executada ou bloqueada com justificativa curta
- evidencias objetivas dos 3 ajustes
- validacao final (approve/refactor/block)
- update sugerido/aplicado em `docs/operations`
- proximo passo recomendado

## Resultado consolidado
- status `applied` continua sob controle de acao humana explicita; fluxo de scraper nao atribui esse estado por default.
- auto-discard para no-match ficou mais consistente, incluindo casos deduplicados ainda em `new` quando `autoDiscard=true`.
- keyword passou a influenciar melhor a visibilidade final:
  - ranking prioriza hits de keyword no titulo quando `q` e fornecido;
  - dashboard reaplica `q` apos scraper bem-sucedido para refletir o contexto da keyword.
