# TASK-SCR-007 - Intelligent scraping big bang (keyword robusta + auto-discard + dedupe observavel)

## Metadata
- id: TASK-SCR-007
- titulo: Consolidar scraping inteligente com keyword robusta, descarte automatico por afinidade e observabilidade de dedupe
- capability: job-scraping
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-26
- source-of-truth: docs + code + local gates

## Objetivo unico
Materializar um ciclo unico de evolucao do scraping para aumentar qualidade de vagas ingeridas: keyword robusta fim-a-fim, descarte automatico de vagas sem afinidade com skills do profile ativo e dedupe observavel em nivel operacional.

## Contexto
- TASK-SCR-006 concluiu platform sources (LinkedIn/Gupy) com ressalvas.
- O usuario reportou baixa percepcao de novidade entre execucoes e keyword pouco efetiva.
- O usuario pediu ciclo maior para destravar evolucao funcional de produto sem virar refatoracao generica.

## Escopo desta task
1. Keyword robusta no scraping:
- aplicar keyword em fonte quando suportada;
- aplicar filtro local consistente antes de persistir;
- registrar no report quantas vagas foram descartadas por keyword.

2. Auto-discard por afinidade:
- vagas sem skills em comum com profile alvo devem receber tag/status automatico de descarte;
- manter reversibilidade operacional via tags/status ja existentes.

3. Dedupe observavel:
- expor contadores claros de fetched/ingested/deduplicated/discarded;
- registrar evidencia por fonte e consolidado.

4. Evidencia e validacao:
- execution report completo;
- verification report com classificacao oficial;
- update de estados em `docs/operations`.

## Fora de escopo
- bypass de captcha/anti-bot ou scraping autenticado.
- automacao de candidatura final.
- mudanca canonica de arquitetura.

## Dependencias satisfeitas
- pipeline kickoff + single-turn pipeline mode ativos.
- execution artifact mode e validacao anti-narrativa ativos.
- stack com Prisma/Postgres e plataforma scraping basica ja operacional.

## Dependencias em aberto
- definicao de politica fina de profile alvo para auto-discard (fallback quando nao houver profile explicito).
- calibracao de limiares de descarte para evitar falso negativo excessivo.

## Resultado final do ciclo
- keyword robusta materializada com normalizacao, aliases e `keywordEffective`.
- auto-discard materializado no ingest via scraper para vagas sem match com profile padrao (`userStatus=discarded`, tag removivel `auto-discard-no-match`).
- report de scraper ampliado com `autoDiscarded`, `keywordRequested` e `keywordEffective`.
- gates locais aprovados: `typecheck`, `lint` e `test` (61 testes).

## Acceptance criteria
- AC1: `POST /v1/scraper/run` retorna resumo com `fetched`, `ingested`, `deduplicated` e `discardedByKeyword` por fonte e total.
- AC2: vagas sem overlap de skills com profile alvo nao chegam como candidatas ativas no dashboard (ficam auto-descartadas/tagueadas).
- AC3: rodadas consecutivas mostram queda observavel de ingestao duplicada sem perder vagas novas.
- AC4: keyword `junior`, `pleno` e skill tecnica (ex: `react`) altera materialmente o conjunto salvo.
- AC5: docs operacionais atualizadas (taskyfier/orchestrator/verifier) no mesmo ciclo.

## DoD
- codigo entregue com artefatos materiais no ciclo.
- lint/typecheck/test verdes.
- smoke de scraper com keyword e repeticao de rodada.
- execution + verification registrados em `docs/tasks`.

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- execution_mode_required: single-turn pipeline mode
- specialist_expected: olympus-runtime-builder (+ olympus-quality-builder para gates)
- constraints:
  - nao abrir escopo fora de scraping/matching operacional relacionado aos ACs;
  - preservar naming e contrato das rotas existentes;
  - manter chat curto e detalhes nos arquivos.
- expected_artifacts:
  - patch de codigo dos fluxos de scraper/match/dedupe;
  - report de execucao com evidencias observaveis;
  - update de estados `docs/operations`.

## Retorno esperado do ciclo
- task executada ou bloqueada com justificativa objetiva;
- evidencias por fonte e por rodada;
- classificacao final do Verifier;
- updates sugeridos/aplicados em `docs/operations`;
- proximo passo recomendado.
