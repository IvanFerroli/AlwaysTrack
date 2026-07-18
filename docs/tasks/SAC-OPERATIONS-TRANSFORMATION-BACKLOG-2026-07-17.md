# Backlog de Transformacao Operacional SAC - 2026-07-17

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/SAC-OPERATIONS-TRANSFORMATION-BACKLOG-2026-07-17.md

## Uso deste backlog
Os arquivos `TASK-AT-362` a `TASK-AT-390` preservam a decomposicao e os criterios de aceite originais desta rodada. O campo `status: proposed` identifica essa baseline de taskificacao e nao deve ser interpretado como status atual de implementacao. A reconciliacao entre task, commit, evidencia e pendencia pertence ao gate `TASK-AT-390`.

## Objetivo
Aposentar as superficies operacionais de Vendas sem perda de dados e estabelecer Pausas, Performance e Campanhas SAC com governanca, seguranca e operacao reversivel.

## Estado observado
- A navegacao ainda expoe Dashboard de vendas, Notas, Ranking, Campanhas e Extratos.
- API e Web usam contratos `sales.*`, `SalesCampaign`, `RankingSnapshot`, `SellerProfile` e `SalesGroup`.
- Campanhas e graficos existentes sao comerciais e dependem de notas aprovadas; nao podem ser apenas renomeados para SAC.
- SAC ainda nao possui time historico proprio, agenda de pausas ou registros governados de performance.
- RBAC atual exclui SAC das superficies comerciais e nao possui permissoes granulares para os novos dominios.

## Invariantes
1. Nenhuma task desta frente executa `DROP`, `TRUNCATE`, exclusao em massa ou sobrescrita destrutiva de historico comercial.
2. Dados `Sales*` permanecem identificados como legado comercial; nao viram dados SAC por inferencia.
3. Rotas antigas de escrita sao congeladas antes da retirada visual; leituras de compatibilidade sao read-only, observaveis e com prazo de sunset.
4. Toda regra de capacidade e avaliada no backend em transacao; esconder acao na Web nao e controle de concorrencia.
5. Troca e override preservam antes/depois, ator, motivo, tenant e horario.
6. CSAT e SLA guardam componentes agregaveis; porcentagens nao sao somadas nem mediadas sem peso.
7. Graficos e campanhas SAC usam somente dados de performance aprovados e nunca recriam ranking nominal.
8. Evidencia local, fake, production-like e live permanece explicitamente classificada.

## Sequencia recomendada
- Fundacao e compatibilidade: TASK-AT-362 a TASK-AT-366.
- Pausas SAC: TASK-AT-367 a TASK-AT-372.
- Performance SAC: TASK-AT-373 a TASK-AT-377.
- Campanhas SAC: TASK-AT-378 a TASK-AT-380.
- Integracao e aposentadoria visual: TASK-AT-381 e TASK-AT-382.
- Fechamento transversal: TASK-AT-383 a TASK-AT-390.

## Tasks
- `TASK-AT-362` - contrato canonico de aposentadoria e compatibilidade.
- `TASK-AT-363` - times SAC e historico de lotacao.
- `TASK-AT-364` - RBAC, tenancy e taxonomia de auditoria SAC.
- `TASK-AT-365` - preservacao e acesso read-only ao legado de Vendas.
- `TASK-AT-366` - congelamento de escritas, jobs e APIs operacionais de Vendas.
- `TASK-AT-367` - modelo de pausas, escala e politica de capacidade.
- `TASK-AT-368` - administracao de slots e publicacao de agenda.
- `TASK-AT-369` - escolha e reserva concorrente de pausa.
- `TASK-AT-370` - troca atomica de pausas entre atendentes.
- `TASK-AT-371` - overrides de pausa auditados.
- `TASK-AT-372` - grafico de overlap e cobertura.
- `TASK-AT-373` - dicionario e modelo de metricas de Performance SAC.
- `TASK-AT-374` - lancamento manual e importacao governada.
- `TASK-AT-375` - revisao, aprovacao e correcao versionada.
- `TASK-AT-376` - agregacoes por atendente, time e periodo.
- `TASK-AT-377` - workspace e graficos de Performance SAC.
- `TASK-AT-378` - fundacao aditiva de Campanhas SAC e legado de campanhas.
- `TASK-AT-379` - ciclo de vida e segmentacao de Campanhas SAC.
- `TASK-AT-380` - metas, resultados e graficos de Campanhas SAC.
- `TASK-AT-381` - retirada visual de Vendas e saneamento de nomenclatura.
- `TASK-AT-382` - integracao no dashboard administrativo.
- `TASK-AT-383` - observabilidade, SLOs e alertas.
- `TASK-AT-384` - testes de dominio, API, tenancy e concorrencia.
- `TASK-AT-385` - testes Web, E2E, acessibilidade e regressao visual.
- `TASK-AT-386` - coverage, contratos, carga e gates de qualidade.
- `TASK-AT-387` - seed SAC deterministico e cenarios de demonstracao.
- `TASK-AT-388` - documentacao de produto, dados, API e operacao.
- `TASK-AT-389` - rollout, sunset e rollback ensaiado.
- `TASK-AT-390` - gate final de prontidao da transformacao SAC.

## Caminho critico
TASK-AT-362 -> TASK-AT-363 -> TASK-AT-364 -> TASK-AT-367 -> TASK-AT-369 -> TASK-AT-372 -> TASK-AT-373 -> TASK-AT-375 -> TASK-AT-376 -> TASK-AT-378 -> TASK-AT-380 -> TASK-AT-381 -> TASK-AT-382 -> TASK-AT-384 -> TASK-AT-386 -> TASK-AT-389 -> TASK-AT-390.

## Riscos transversais
- Renomear estruturas comerciais e apagar a proveniencia do historico.
- Reintroduzir competicao nominal por meio de graficos ou campanhas SAC.
- Permitir overbooking por validacao fora de transacao.
- Agregar CSAT/SLA por media de percentuais e publicar numeros incorretos.
- Fazer rollback de codigo sem preservar migracoes aditivas e registros criados.
