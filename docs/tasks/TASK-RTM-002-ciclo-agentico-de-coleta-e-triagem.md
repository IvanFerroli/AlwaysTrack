# TASK-RTM-002 - Ciclo agêntico de coleta e triagem de vagas

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-RTM-002-ciclo-agentico-de-coleta-e-triagem.md

## Modo
- mode: runtime

## Objetivo unico
Criar um ciclo operacional único (trigger único) para: coletar vagas, enriquecer com IA, ranquear, aplicar dedupe/saneamento e devolver shortlist explicada.

## Contexto minimo
Hoje as capacidades existem, mas ainda dependem de operação manual em etapas. O diferencial desejado é comportamento mais agentic e inteligente ponta-a-ponta, sem inventar kit novo.

## Inputs
- `services/api/src/main.ts`
- `services/api/src/features/scraper/*`
- `services/api/src/features/acquisition/*`
- `services/api/src/features/match/*`
- `services/api/src/features/strategy/*`

## Dependencias
- satisfeitas: TASK-SCR-009, TASK-SCR-010, TASK-MCH-003
- em aberto: definição de budget/limite de rodada IA

## Alvos explicitos
1. Introduzir endpoint de orquestração de ciclo único (ex.: `POST /v1/pipeline/run`) sem substituir endpoints atuais.
2. Orquestrar internamente: scrape/acquire -> enrich LLM opcional -> rank -> shortlist.
3. Retornar relatório consolidado com:
   - fontes usadas e modo (auto/fallback)
   - volume coletado/ingestado/deduplicado
   - top vagas com justificativa curta de afinidade
4. Persistir evidência do ciclo em logs já existentes (`agent-runs`, `decision-logs`, `skill-executions`).

## Fora de escopo
- automação de candidatura sem gate humano;
- criação de novo kit/agente fora do ecossistema atual;
- workflows externos (email, whatsapp, etc.).

## Checklist
1. Definir contrato de entrada/saída do endpoint de pipeline.
2. Implementar orquestração reaproveitando serviços existentes.
3. Garantir idempotência mínima da rodada.
4. Cobrir teste de integração do fluxo consolidado.

## Acceptance Criteria
1. Um único request executa ciclo completo e retorna resumo consolidado.
2. Evidência do ciclo fica registrada nas superfícies de observabilidade existentes.
3. Falha parcial não invalida resposta completa (com ressalvas claras).

## Definition of Done
1. Pipeline operacional unificado disponível em API.
2. Evidência de execução completa com payload real e testes.

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run test --workspace @olympus/api`
- revisao manual:
  - executar endpoint e validar shortlist + evidências em logs.

## Evidencia esperada
- payload de `/v1/pipeline/run` com consolidado;
- registros correspondentes em `agent-runs`, `decision-logs`, `skill-executions`.

## Riscos
- endpoint ficar grande demais sem limites claros;
- custo IA crescer sem budget por rodada.

## Blockers possiveis
- ausência de chave/config IA no ambiente;
- timeout de fontes externas durante rodada única.

## Feedback obrigatorio de retorno
- qual foi o tempo total de ciclo e custo estimado?
- shortlist retornada ficou explicável e útil para decisão humana?
