# TASKYFIER MEMORY — OLYMPUS CLIMB

## Status do projeto
- classificacao operacional atual: alpha local funcional com persistencia Prisma/Postgres
- status adicional: pronto para ciclos de produto com gates obrigatorios
- documento canonico vigente: Consolidado Canonico do Projeto Olympus Climb (Base Vigente)
- macro-objetivo atual: evoluir produto real mantendo rastreabilidade, evidencia e escopo canonico
- protocolo operacional de pipeline: `docs/operations/engineering-pipeline-protocol.md`
- ultima auditoria de sanidade: `docs/operations/repository-audit-2026-04-25.md`

## Ordem de precedencia usada pelo Taskyfier
1. Consolidado canonico vigente
2. ADRs aceitas
3. Specs aceitas
4. Codigo implementado validado por gates
5. Task manifests existentes
6. Esta memoria operacional
7. GitFlow vigente
8. Legado compativel

## Capabilities atualmente ativas
- job-acquisition
- job-ingestion
- job-scraping
- resume-profile-management
- cv-analysis
- job-matching
- deep-score-ai
- strategy-approval-gate
- application-tracking
- runtime-observability

## Frente atualmente ativa
- produto alpha local estabilizado apos auditoria pesada; pronto para ciclos funcionais com gates

## ADRs aceitas relevantes
- ADR-001 - governanca documental operacional (`docs/adr/ADR-001-governanca-documental-operacional.md`)

## Specs aceitas relevantes
- nenhuma ainda formalizada

## Task manifests existentes relevantes
- TASK-DOC-002 - formalizar ADR-001
- TASK-SCF-001 - scaffold base de workspaces
- TASK-QLT-001 - baseline de typecheck executavel
- TASK-QLT-002 - baseline de lint executavel
- TASK-CTR-001 - contrato tipado compartilhado minimo
- TASK-RTM-001 - bootstrap de runtime local
- TASK-PRD-001 - main CV workbench e menu de rotas
- TASK-PRD-002 - listagem de vagas por afinidade
- TASK-PRD-003 - start climbing button
- TASK-PRD-004 - domain tags/status
- TASK-PRD-005 - filtros API
- TASK-PRD-006 - filtros UI
- TASK-PRD-007 - filtros avancados/tags customizadas
- TASK-SCR-001 - nucleo scraper de vagas
- TASK-SCR-002 - strip HTML descricoes
- TASK-SCR-003 - multi-source scraper
- TASK-SCR-005 - scraper boost
- TASK-SCR-007 - intelligent scraping big bang (keyword robusta + auto-discard + dedupe observavel)
- TASK-SCR-008 - sanidade pos-scraper (applied indevido + auto-discard score 0 + prioridade por keyword)
- TASK-ACQ-001 - job acquisition layer (wire + ui)
- TASK-ACQ-002 - adaptadores ats específicos (gupy/sólides)
- TASK-UX-003 - hierarquia toggle e overhaul de filtros no dashboard
- TASK-SCR-009 - scraper throughput e observabilidade por fonte
- TASK-SCR-010 - ampliar fontes de plataforma com fallback operacional
- TASK-MCH-002 - afinidade v2 com ponderação e calibração
- TASK-MCH-003 - leitura LLM estruturada de vagas
- TASK-PRD-008 - filtros reativos e performance
- TASK-RTM-002 - ciclo agêntico de coleta e triagem de vagas

## Tasks concluidas ou operacionalmente incorporadas
- TASK-DOC-002
- TASK-SCF-001
- TASK-QLT-001
- TASK-QLT-002
- TASK-CTR-001
- TASK-RTM-001
- TASK-PRD-001
- TASK-PRD-002
- TASK-PRD-003
- TASK-PRD-004 (completed-with-remarks)
- TASK-PRD-005 (completed-with-remarks)
- TASK-PRD-006 (completed-with-remarks)
- TASK-PRD-007 (completed-with-remarks)
- TASK-SCR-001
- TASK-SCR-002
- TASK-SCR-003
- TASK-SCR-005 (completed-with-remarks)
- TASK-SCR-006 (completed-with-remarks)
- TASK-SCR-007 (completed-with-remarks)
- TASK-SCR-008 (completed-with-remarks)
- TASK-SCR-009 (completed-with-remarks)
- TASK-MCH-002 (completed-with-remarks)
- TASK-ACQ-001 (completed-with-remarks)
- TASK-ACQ-002
- TASK-UX-001 (completed-with-remarks)
- auditoria de sanidade e normalizacao do repo (2026-04-25)
- TASK-UX-002 - Refinamento de Tags e Filtros do Dashboard
- TASK-UX-003 - Hierarquia toggle e overhaul de filtros no dashboard

## Tasks em andamento
- nenhuma

## Tasks pendentes priorizadas (pipeline recomendado)
1. TASK-MCH-003 - leitura LLM estruturada de vagas
2. TASK-SCR-010 - ampliar fontes de plataforma com fallback operacional
3. TASK-PRD-008 - filtros reativos e performance
4. TASK-RTM-002 - ciclo agêntico de coleta e triagem de vagas

## Tasks bloqueadas
- nenhuma formalmente bloqueada

## Dependencias abertas
- specs minimas por capability de produto
- policy explicita para uso de LLM externo em CV/deep score
- paginacao/limites de armazenamento runtime
- suite de smoke tests web/API alem dos testes unitarios de servico
- decidir se CryptoJobsList volta via parser RSS dedicado ou permanece fora do `source=all`
- persistir ou recalcular historicamente contadores runtime de metricas como ingestionAttempts/dedupeHits
- baseline de calibracao de afinidade com dataset curado de vagas/perfis reais
- policy de budget/limite por rodada para uso de LLM no enriquecimento de vagas

## Decisoes praticas recentes
- `GET /` e dashboard central com rotas e ranking por afinidade.
- `GET /workspace` e superficie operacional para execucao manual e gates humanos.
- `GET /guide` e guia vivo de uso.
- `docs/` permanece fonte viva; `doc/` permanece historico e fonte local dos CVs.
- O runtime principal usa Prisma/Postgres; `DATABASE_URL` precisa estar configurada e o schema sincronizado.
- O scoring local de Match e Strategy deve usar a mesma rotina compartilhada.
- O scoring deve tratar skills pontuadas como `node.js`/`next.js` como grupos de tokens equivalentes quando os tokens da vaga baterem.
- O scoring de afinidade local deve reconhecer aliases tecnicos comuns (`node`/`node.js`, `react`/`react.js`, `ts`/`typescript`) e evitar boost por palavras genericas como `developer`, `engineer`, `senior` sem skill tecnica.
- Rotas POST no dashboard nao devem ser abertas como links GET; devem ser acionadas por form/fetch/curl.
- Dados vindos de scraper, CV, profile, decision logs e LLM devem ser escapados antes de render HTML.
- Servidores locais fazem bind em `127.0.0.1` por padrao.
- `npm run check` e gate minimo para declarar ciclo saudavel.
- CryptoJobsList esta fora de `source=all` porque o endpoint JSON usado historicamente nao esta operacional; reativar exige task propria com evidencia.
- LinkedIn e Gupy estao em `source=all` como platform sources operacionais; vagas persistem no Postgres com `sourceName`.
- Indeed e Glassdoor permanecem nomeados, mas indisponiveis no runner automatico porque retornam security check sem feed publico estavel neste ambiente.
- Dashboard prioriza quick actions e vagas por afinidade acima de rotas/overview; secoes sao colapsaveis para reduzir ruido.
- Filtros do dashboard sao multi-select (toggle por clique simples) derivados do batch atual; tags/local/fonte/status aplicam OR.
- Keyword do scraper aplica pos-filtro local antes da persistencia; termos de senioridade como `junior` sao estritos ao titulo para evitar salvar senior por ruido de descricao.
- TASK-SCR-007 consolidou keyword robusta (normalizacao + aliases + `keywordEffective`) e auto-discard por afinidade com tag removivel `auto-discard-no-match`.
- report de scraper agora expõe `autoDiscarded`, `keywordRequested` e `keywordEffective` por rodada.
- TASK-SCR-008 consolidou sanidade pos-scraper com prioridade de keyword no ranking (`q`) e auto-discard consistente tambem para casos deduplicados ainda em `new`.
- TASK-MCH-002 consolidou afinidade v2 com score ponderado explicito, penalidade controlada por mismatch de senioridade e `scoreBreakdown` opcional para debug operacional.
- dashboard passou a reaplicar `q` apos run de scraper para refletir contexto de keyword no topo da lista.
- dashboard ganhou toggle direto para hierarquia de data (mais novo/mais antigo) sem depender de select convencional.
- filtros compactos agora incluem busca interna por opcao, limpar por dropdown e resumo de filtros ativos para leitura rapida.
- Acquisition bloqueia hosts locais/privados obvios, revalida redirects manuais e limita tamanho de resposta antes de ingerir conteudo remoto.
- `npm run up` preserva a porta 5432, sincroniza Prisma e falha cedo em vez de mascarar erro de setup.

## Padrões já adotados
- menor entrega util primeiro quando nao houver pedido explicito de ciclo maior
- toda task deve ter objetivo unico, validacao e evidencia
- produto pode evoluir funcionalmente quando estiver alinhado ao canonico
- task package e updates de memoria devem ser materializados em docs quando longos
- Compact Docs-First Mode: chat curto, docs como detalhe

## Pontos sensiveis
- docs historicas podem conter claims de validacao sem comando real; tratar como historico ate reconfirmar
- evitar abrir automacao externa/LLM sem clareza de privacidade e custo
- evitar depender de `dist/` stale; usar `npm run dev` ou rodar `npm run build` antes de `start`
- evitar CORS/host permissivos fora de uso local consciente

## Proxima menor tarefa util sugerida
- TASK-MCH-003 - adicionar leitura LLM estruturada de vagas com budget/policy explicita e evidencia de custo/ganho

## Notas de continuidade
- atualizar esta memoria a cada ciclo relevante concluido, bloqueado ou replanejado
- manter `docs/README.md` e `docs/runbooks/README.md` alinhados as rotas reais
- quando uma verificacao historica nao tiver evidencia material, registrar ressalva em vez de tratar como gate atual
